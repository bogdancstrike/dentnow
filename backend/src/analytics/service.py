"""Analytics ingestion, aggregation, export and retention services."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from src.analytics.models import AnalyticsDailyMetric, AnalyticsEvent
from src.analytics.privacy import (
    derive_identity,
    referrer_host,
    tracking_suppression_reason,
)
from src.analytics.schemas import AnalyticsEventInput
from src.config import Config


def collect_event(
    session: Session,
    payload: AnalyticsEventInput,
    request,
    *,
    now: datetime | None = None,
) -> dict:
    reason = tracking_suppression_reason(request, payload.consent_granted)
    if reason:
        return {"accepted": False, "reason": reason}
    now = now or datetime.now(timezone.utc)
    identity = derive_identity(request, now)
    recent = (
        session.scalar(
            select(func.count(AnalyticsEvent.id)).where(
                AnalyticsEvent.visitor_key == identity.visitor_key,
                AnalyticsEvent.occurred_at >= now - timedelta(minutes=1),
            )
        )
        or 0
    )
    if recent >= Config.ANALYTICS_RATE_LIMIT_PER_MINUTE:
        return {"accepted": False, "reason": "rate_limited"}
    session.add(
        AnalyticsEvent(
            occurred_at=now,
            visitor_key=identity.visitor_key,
            session_key=identity.session_key,
            key_version=identity.key_version,
            client_ip=identity.client_ip,
            user_agent=identity.user_agent,
            event_type=payload.event_type,
            path=payload.path,
            target_type=payload.target_type,
            target_key=payload.target_key,
            section_id=payload.section_id,
            referrer_host=referrer_host(payload.referrer),
            device_family=identity.device_family,
            browser_family=identity.browser_family,
            os_family=identity.os_family,
            country_code=identity.country_code,
            region=identity.region,
            city=identity.city,
            latitude=payload.latitude
            if payload.latitude is not None
            else identity.latitude,
            longitude=payload.longitude
            if payload.longitude is not None
            else identity.longitude,
            geo_accuracy_m=payload.geo_accuracy_m,
            engaged_seconds=payload.engaged_seconds,
        )
    )
    return {"accepted": True}


def _bounds(date_from: date, date_to: date, tz_name: str) -> tuple[datetime, datetime]:
    tz = ZoneInfo(tz_name)
    return (
        datetime.combine(date_from, time.min, tzinfo=tz).astimezone(timezone.utc),
        datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=tz).astimezone(
            timezone.utc
        ),
    )


def _range_filter(start: datetime, end: datetime):
    return (AnalyticsEvent.occurred_at >= start, AnalyticsEvent.occurred_at < end)


def _scalar_metrics(session: Session, start: datetime, end: datetime) -> dict[str, int]:
    row = session.execute(
        select(
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
            func.count(distinct(AnalyticsEvent.session_key)).label("sessions"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == "page_view")
            .label("page_views"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == "contact_cta")
            .label("cta_clicks"),
        ).where(*_range_filter(start, end))
    ).one()
    return {
        key: int(getattr(row, key) or 0)
        for key in ("visitors", "sessions", "page_views", "cta_clicks")
    }


def _percent_delta(current: int, previous: int) -> float | None:
    if previous == 0:
        return 100.0 if current else None
    return round((current - previous) * 100 / previous, 1)


def _dimension(
    session: Session,
    start: datetime,
    end: datetime,
    column,
    *,
    filters: tuple = (),
    limit: int = 10,
) -> list[dict[str, Any]]:
    key = func.coalesce(column, "Direct / necunoscut").label("key")
    rows = session.execute(
        select(
            key,
            func.count(AnalyticsEvent.id).label("views"),
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
        )
        .where(*_range_filter(start, end), *filters)
        .group_by(key)
        .order_by(func.count(AnalyticsEvent.id).desc(), key)
        .limit(limit)
    ).all()
    return [
        {"key": row.key, "views": int(row.views), "visitors": int(row.visitors)}
        for row in rows
    ]


def analytics_overview(
    session: Session,
    date_from: date,
    date_to: date,
    *,
    timezone_name: str = "Europe/Bucharest",
) -> dict[str, Any]:
    start, end = _bounds(date_from, date_to, timezone_name)
    span = end - start
    current = _scalar_metrics(session, start, end)
    previous = _scalar_metrics(session, start - span, start)

    active_visitors = (
        select(AnalyticsEvent.visitor_key.label("visitor_key"))
        .where(*_range_filter(start, end))
        .distinct()
        .subquery()
    )
    returning = (
        session.scalar(
            select(func.count(distinct(AnalyticsEvent.visitor_key))).where(
                AnalyticsEvent.visitor_key.in_(select(active_visitors.c.visitor_key)),
                AnalyticsEvent.occurred_at < start,
            )
        )
        or 0
    )
    current["returning_visitors"] = int(returning)
    current["new_visitors"] = max(0, current["visitors"] - int(returning))
    current["cta_conversion"] = (
        round(current["cta_clicks"] * 100 / current["visitors"], 1)
        if current["visitors"]
        else 0.0
    )

    day_expr = func.date(
        func.timezone(timezone_name, AnalyticsEvent.occurred_at)
    ).label("day")
    trend_rows = session.execute(
        select(
            day_expr,
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
            func.count(distinct(AnalyticsEvent.session_key)).label("sessions"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == "page_view")
            .label("page_views"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == "contact_cta")
            .label("cta_clicks"),
        )
        .where(*_range_filter(start, end))
        .group_by(day_expr)
        .order_by(day_expr)
    ).all()
    by_day = {row.day: row for row in trend_rows}
    trend = []
    cursor = date_from
    while cursor <= date_to:
        row = by_day.get(cursor)
        trend.append(
            {
                "date": cursor.isoformat(),
                "visitors": int(row.visitors) if row else 0,
                "sessions": int(row.sessions) if row else 0,
                "page_views": int(row.page_views) if row else 0,
                "cta_clicks": int(row.cta_clicks) if row else 0,
            }
        )
        cursor += timedelta(days=1)

    country_key = func.coalesce(AnalyticsEvent.country_code, "Necunoscut").label(
        "country"
    )
    region_key = func.coalesce(AnalyticsEvent.region, "Necunoscut").label("region")
    city_key = func.coalesce(AnalyticsEvent.city, "Necunoscut").label("city")
    geo_rows = session.execute(
        select(
            country_key,
            region_key,
            city_key,
            func.avg(AnalyticsEvent.latitude).label("latitude"),
            func.avg(AnalyticsEvent.longitude).label("longitude"),
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
            func.count(AnalyticsEvent.id).label("views"),
        )
        .where(*_range_filter(start, end))
        .group_by(country_key, region_key, city_key)
        .order_by(func.count(distinct(AnalyticsEvent.visitor_key)).desc())
        .limit(100)
    ).all()
    geography = [
        {
            "country": row.country,
            "region": row.region,
            "city": row.city,
            "latitude": float(row.latitude) if row.latitude is not None else None,
            "longitude": float(row.longitude) if row.longitude is not None else None,
            "visitors": int(row.visitors),
            "views": int(row.views),
        }
        for row in geo_rows
    ]

    deltas = {
        key: _percent_delta(current[key], previous[key])
        for key in ("visitors", "sessions", "page_views", "cta_clicks")
    }
    return {
        "range": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
            "timezone": timezone_name,
        },
        "collection": {
            "enabled": Config.ANALYTICS_ENABLED,
            "require_consent": Config.ANALYTICS_REQUIRE_CONSENT,
            "raw_retention_days": Config.ANALYTICS_EVENT_RETENTION_DAYS,
            "aggregate_retention_days": Config.ANALYTICS_AGGREGATE_RETENTION_DAYS,
        },
        "kpis": {**current, "deltas": deltas},
        "trend": trend,
        "top_pages": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.path,
            filters=(AnalyticsEvent.event_type == "page_view",),
            limit=20,
        ),
        "top_sections": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.section_id,
            filters=(AnalyticsEvent.event_type == "section_view",),
            limit=20,
        ),
        "top_articles": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.target_type == "article",),
            limit=20,
        ),
        "top_treatments": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.target_type == "treatment",),
            limit=20,
        ),
        "top_offers": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.target_type == "offer",),
            limit=20,
        ),
        "top_clinics": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.target_type == "clinic",),
            limit=20,
        ),
        "contact_ctas": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.event_type == "contact_cta",),
            limit=20,
        ),
        "referrers": _dimension(
            session, start, end, AnalyticsEvent.referrer_host, limit=20
        ),
        "devices": _dimension(session, start, end, AnalyticsEvent.device_family),
        "browsers": _dimension(session, start, end, AnalyticsEvent.browser_family),
        "operating_systems": _dimension(session, start, end, AnalyticsEvent.os_family),
        "ip_addresses": _dimension(
            session, start, end, func.host(AnalyticsEvent.client_ip), limit=20
        ),
        "user_agents": _dimension(
            session, start, end, AnalyticsEvent.user_agent, limit=20
        ),
        "geography": geography,
    }


def overview_csv(overview: dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["data", "vizitatori", "sesiuni", "vizualizari_pagini", "clickuri_contact"]
    )
    for row in overview["trend"]:
        writer.writerow(
            [
                row["date"],
                row["visitors"],
                row["sessions"],
                row["page_views"],
                row["cta_clicks"],
            ]
        )
    writer.writerow([])
    writer.writerow(["categorie", "element", "vizualizari", "vizitatori_unici"])
    for category in (
        "top_pages",
        "top_articles",
        "top_treatments",
        "top_offers",
        "devices",
        "browsers",
        "referrers",
        "ip_addresses",
        "user_agents",
    ):
        for row in overview[category]:
            writer.writerow([category, row["key"], row["views"], row["visitors"]])
    return output.getvalue()


def rollup_day(
    session: Session, day: date, *, timezone_name: str = "Europe/Bucharest"
) -> int:
    start, end = _bounds(day, day, timezone_name)
    metrics: list[tuple[str, str, str, int]] = []
    totals = _scalar_metrics(session, start, end)
    metrics.extend((metric, "all", "", value) for metric, value in totals.items())
    for dimension_name, column in (
        ("device", AnalyticsEvent.device_family),
        ("browser", AnalyticsEvent.browser_family),
        ("country", AnalyticsEvent.country_code),
        ("page", AnalyticsEvent.path),
    ):
        for row in _dimension(session, start, end, column, limit=1000):
            metrics.append(("views", dimension_name, row["key"], row["views"]))
            metrics.append(("visitors", dimension_name, row["key"], row["visitors"]))
    for metric, dimension_type, dimension_key, value in metrics:
        statement = (
            insert(AnalyticsDailyMetric)
            .values(
                day=day,
                metric=metric,
                dimension_type=dimension_type,
                dimension_key=dimension_key,
                value=value,
            )
            .on_conflict_do_update(
                constraint="pk_analytics_daily_metrics",
                set_={"value": value, "updated_at": func.now()},
            )
        )
        session.execute(statement)
    return len(metrics)


def prune_retention(session: Session, *, now: datetime | None = None) -> dict[str, int]:
    now = now or datetime.now(timezone.utc)
    raw = (
        session.execute(
            delete(AnalyticsEvent).where(
                AnalyticsEvent.occurred_at
                < now - timedelta(days=Config.ANALYTICS_EVENT_RETENTION_DAYS)
            )
        ).rowcount
        or 0
    )
    aggregates = (
        session.execute(
            delete(AnalyticsDailyMetric).where(
                AnalyticsDailyMetric.day
                < now.date() - timedelta(days=Config.ANALYTICS_AGGREGATE_RETENTION_DAYS)
            )
        ).rowcount
        or 0
    )
    return {"raw_events_deleted": raw, "daily_metrics_deleted": aggregates}


def delete_visitor(session: Session, visitor_key_hex: str) -> int:
    """Operational erasure primitive for a known pseudonymous visitor key."""
    try:
        key = bytes.fromhex(visitor_key_hex)
    except ValueError:
        return 0
    if len(key) != 32:
        return 0
    return (
        session.execute(
            delete(AnalyticsEvent).where(AnalyticsEvent.visitor_key == key)
        ).rowcount
        or 0
    )
