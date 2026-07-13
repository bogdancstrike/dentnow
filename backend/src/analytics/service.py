"""Analytics ingestion, reporting, export, rollup, and retention services.

PostgreSQL is required. The implementation deliberately keeps transaction
ownership in the caller: functions flush/execute changes, but never commit.
"""

from __future__ import annotations

import csv
import hashlib
import io
import math
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Final, Sequence
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import Date, Numeric, cast, delete, distinct, func, select
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


UNKNOWN_LABEL: Final[str] = "Necunoscut"
DIRECT_UNKNOWN_LABEL: Final[str] = "Direct / necunoscut"

LOCATION_SOURCE_BROWSER: Final[str] = "browser"
LOCATION_SOURCE_IP: Final[str] = "ip"
LOCATION_SOURCE_NONE: Final[str] = "none"

PAGE_VIEW: Final[str] = "page_view"
CONTACT_CTA: Final[str] = "contact_cta"
SECTION_VIEW: Final[str] = "section_view"


@dataclass(frozen=True, slots=True)
class ResolvedLocation:
    latitude: float | None
    longitude: float | None
    accuracy_m: float | None
    source: str


# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------


def _config_bool(name: str, default: bool) -> bool:
    value = getattr(Config, name, default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _config_int(name: str, default: int, *, minimum: int = 0) -> int:
    value = int(getattr(Config, name, default))
    return max(minimum, value)


def _timezone(tz_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"Unknown IANA timezone: {tz_name!r}") from exc


def _as_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        raise ValueError("'now' must be timezone-aware")
    return value.astimezone(timezone.utc)


def _validate_date_range(date_from: date, date_to: date) -> None:
    if date_from > date_to:
        raise ValueError("date_from must be less than or equal to date_to")

    max_days = _config_int("ANALYTICS_MAX_REPORT_RANGE_DAYS", 366, minimum=1)
    requested_days = (date_to - date_from).days + 1
    if requested_days > max_days:
        raise ValueError(
            f"Requested analytics range is {requested_days} days; "
            f"maximum is {max_days} days"
        )


# ---------------------------------------------------------------------------
# Ingestion helpers
# ---------------------------------------------------------------------------


def _finite_number(
    value: Any,
    *,
    minimum: float,
    maximum: float,
    field_name: str,
) -> float | None:
    if value is None:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be numeric") from exc
    if not math.isfinite(result):
        raise ValueError(f"{field_name} must be finite")
    if not minimum <= result <= maximum:
        raise ValueError(
            f"{field_name} must be between {minimum} and {maximum}"
        )
    return result


def _identity_has_geo_metadata(identity: Any) -> bool:
    return any(
        getattr(identity, field, None)
        for field in (
            "country_name",
            "country_code",
            "region",
            "region_code",
            "city",
            "postal_code",
            "timezone_name",
        )
    )


def _safe_identity_coordinate(
    value: Any,
    *,
    minimum: float,
    maximum: float,
) -> float | None:
    """Treat malformed third-party IP geolocation coordinates as unavailable."""

    try:
        return _finite_number(
            value,
            minimum=minimum,
            maximum=maximum,
            field_name="IP geolocation coordinate",
        )
    except ValueError:
        return None


def _resolve_location(payload: AnalyticsEventInput, identity: Any) -> ResolvedLocation:
    """Resolve one internally consistent location source.

    Browser coordinates are used only when explicit consent is true and both
    coordinates are present and valid. If the browser did not provide a valid
    pair, the event can still carry IP-derived geographic metadata. IP-derived
    coordinates themselves are optional because an IP database coordinate is
    commonly an ISP/city centroid, not the user's physical location.
    """

    consent_granted = getattr(payload, "consent_granted", None) is True
    raw_latitude = getattr(payload, "latitude", None)
    raw_longitude = getattr(payload, "longitude", None)
    raw_accuracy = getattr(payload, "geo_accuracy_m", None)

    browser_supplied_any_coordinate = (
        raw_latitude is not None or raw_longitude is not None
    )

    if consent_granted and browser_supplied_any_coordinate:
        if raw_latitude is None or raw_longitude is None:
            raise ValueError(
                "latitude and longitude must either both be supplied or both be null"
            )

        latitude = _finite_number(
            raw_latitude,
            minimum=-90.0,
            maximum=90.0,
            field_name="latitude",
        )
        longitude = _finite_number(
            raw_longitude,
            minimum=-180.0,
            maximum=180.0,
            field_name="longitude",
        )
        accuracy = _finite_number(
            raw_accuracy,
            minimum=0.0,
            maximum=10_000_000.0,
            field_name="geo_accuracy_m",
        )

        return ResolvedLocation(
            latitude=latitude,
            longitude=longitude,
            accuracy_m=accuracy,
            source=LOCATION_SOURCE_BROWSER,
        )

    # Coordinates sent without consent are ignored rather than persisted.
    # We still classify backend-derived country/region/city metadata as IP data.
    ip_latitude = _safe_identity_coordinate(
        getattr(identity, "latitude", None),
        minimum=-90.0,
        maximum=90.0,
    )
    ip_longitude = _safe_identity_coordinate(
        getattr(identity, "longitude", None),
        minimum=-180.0,
        maximum=180.0,
    )

    has_ip_coordinate_pair = ip_latitude is not None and ip_longitude is not None
    has_ip_geo = has_ip_coordinate_pair or _identity_has_geo_metadata(identity)

    if not has_ip_geo:
        return ResolvedLocation(None, None, None, LOCATION_SOURCE_NONE)

    store_ip_coordinates = _config_bool(
        "ANALYTICS_STORE_IP_GEO_COORDINATES",
        False,
    )
    return ResolvedLocation(
        latitude=ip_latitude if store_ip_coordinates and has_ip_coordinate_pair else None,
        longitude=(
            ip_longitude if store_ip_coordinates and has_ip_coordinate_pair else None
        ),
        accuracy_m=None,
        source=LOCATION_SOURCE_IP,
    )


def _advisory_lock_key(namespace: str, value: bytes | str) -> int:
    raw_value = value if isinstance(value, bytes) else value.encode("utf-8")
    digest = hashlib.blake2b(
        namespace.encode("utf-8") + b":" + raw_value,
        digest_size=8,
    ).digest()
    return int.from_bytes(digest, byteorder="big", signed=True)


def _acquire_transaction_lock(
    session: Session,
    namespace: str,
    value: bytes | str,
) -> None:
    """Acquire a PostgreSQL transaction-scoped advisory lock."""

    key = _advisory_lock_key(namespace, value)
    session.execute(select(func.pg_advisory_xact_lock(key)))


def _rate_limit_exceeded(
    session: Session,
    visitor_key: bytes,
    now: datetime,
) -> bool:
    limit = _config_int("ANALYTICS_RATE_LIMIT_PER_MINUTE", 0)
    if limit <= 0:
        return False

    # Serialize the count+insert sequence per visitor. Without this lock,
    # concurrent requests can all observe the same count and exceed the limit.
    if _config_bool("ANALYTICS_USE_DB_RATE_LIMIT_LOCK", True):
        _acquire_transaction_lock(session, "analytics-rate-limit", visitor_key)

    recent = session.scalar(
        select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.visitor_key == visitor_key,
            AnalyticsEvent.occurred_at >= now - timedelta(minutes=1),
            AnalyticsEvent.occurred_at <= now,
        )
    )
    return int(recent or 0) >= limit


def collect_event(
    session: Session,
    payload: AnalyticsEventInput,
    request: Any,
    *,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Validate and add one analytics event to the current transaction.

    The function calls ``flush`` so database validation failures occur before a
    successful response is returned. It intentionally does not commit; the API
    endpoint/unit-of-work must commit on success and roll back on failure.
    """

    if not _config_bool("ANALYTICS_ENABLED", True):
        return {"accepted": False, "reason": "analytics_disabled"}

    suppression_reason = tracking_suppression_reason(request)
    if suppression_reason:
        return {"accepted": False, "reason": suppression_reason}

    consent_granted = getattr(payload, "consent_granted", None) is True
    if _config_bool("ANALYTICS_REQUIRE_CONSENT", False) and not consent_granted:
        return {"accepted": False, "reason": "consent_required"}

    occurred_at = _as_utc(now)
    identity = derive_identity(request, occurred_at)

    raw_visitor_key = getattr(identity, "visitor_key", None)
    if isinstance(raw_visitor_key, str):
        visitor_key = raw_visitor_key.encode("utf-8")
    elif raw_visitor_key is None:
        visitor_key = b""
    else:
        visitor_key = bytes(raw_visitor_key)
    if not visitor_key:
        return {"accepted": False, "reason": "identity_unavailable"}

    if _rate_limit_exceeded(session, visitor_key, occurred_at):
        return {"accepted": False, "reason": "rate_limited"}

    try:
        location = _resolve_location(payload, identity)
    except ValueError as exc:
        return {
            "accepted": False,
            "reason": "invalid_location",
            "detail": str(exc),
        }

    store_raw_ip = _config_bool("ANALYTICS_STORE_RAW_IP", True)
    store_raw_user_agent = _config_bool("ANALYTICS_STORE_RAW_USER_AGENT", True)

    event = AnalyticsEvent(
        occurred_at=occurred_at,
        visitor_key=visitor_key,
        session_key=identity.session_key,
        key_version=identity.key_version,
        client_ip=identity.client_ip if store_raw_ip else None,
        user_agent=identity.user_agent if store_raw_user_agent else None,
        consent_granted=consent_granted,
        event_type=payload.event_type,
        path=payload.path,
        target_type=payload.target_type,
        target_key=payload.target_key,
        section_id=payload.section_id,
        referrer_host=referrer_host(payload.referrer),
        device_family=identity.device_family,
        browser_family=identity.browser_family,
        os_family=identity.os_family,
        country_name=identity.country_name,
        country_code=identity.country_code,
        region=identity.region,
        region_code=identity.region_code,
        city=identity.city,
        latitude=location.latitude,
        longitude=location.longitude,
        postal_code=identity.postal_code,
        timezone_name=identity.timezone_name,
        connection_asn=identity.connection_asn,
        connection_isp=identity.connection_isp,
        geo_accuracy_m=location.accuracy_m,
        engaged_seconds=payload.engaged_seconds,
    )
    session.add(event)
    session.flush()

    return {
        "accepted": True,
        "event_id": str(event.id),
        "location_source": location.source,
    }


# ---------------------------------------------------------------------------
# Reporting helpers
# ---------------------------------------------------------------------------


def _bounds(date_from: date, date_to: date, tz_name: str) -> tuple[datetime, datetime]:
    _validate_date_range(date_from, date_to)
    tz = _timezone(tz_name)
    return (
        datetime.combine(date_from, time.min, tzinfo=tz).astimezone(timezone.utc),
        datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=tz).astimezone(
            timezone.utc
        ),
    )


def _previous_bounds(
    date_from: date,
    date_to: date,
    tz_name: str,
) -> tuple[datetime, datetime]:
    days = (date_to - date_from).days + 1
    previous_to = date_from - timedelta(days=1)
    previous_from = previous_to - timedelta(days=days - 1)
    return _bounds(previous_from, previous_to, tz_name)


def _range_filter(start: datetime, end: datetime) -> tuple[Any, Any]:
    return (AnalyticsEvent.occurred_at >= start, AnalyticsEvent.occurred_at < end)


def _scalar_metrics(session: Session, start: datetime, end: datetime) -> dict[str, int]:
    row = session.execute(
        select(
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
            func.count(distinct(AnalyticsEvent.session_key)).label("sessions"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == PAGE_VIEW)
            .label("page_views"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == CONTACT_CTA)
            .label("cta_clicks"),
            func.count(distinct(AnalyticsEvent.visitor_key))
            .filter(AnalyticsEvent.event_type == CONTACT_CTA)
            .label("cta_visitors"),
        ).where(*_range_filter(start, end))
    ).one()
    return {
        key: int(getattr(row, key) or 0)
        for key in (
            "visitors",
            "sessions",
            "page_views",
            "cta_clicks",
            "cta_visitors",
        )
    }


def _percent_delta(current: int, previous: int) -> float | None:
    if previous == 0:
        return 100.0 if current else None
    return round((current - previous) * 100 / previous, 1)


def _dimension(
    session: Session,
    start: datetime,
    end: datetime,
    column: Any,
    *,
    filters: Sequence[Any] = (),
    limit: int | None = 10,
    unknown_label: str = DIRECT_UNKNOWN_LABEL,
) -> list[dict[str, Any]]:
    key = func.coalesce(column, unknown_label).label("key")
    query = (
        select(
            key,
            func.count(AnalyticsEvent.id).label("views"),
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
        )
        .where(*_range_filter(start, end), *filters)
        .group_by(key)
        .order_by(func.count(AnalyticsEvent.id).desc(), key)
    )
    if limit is not None:
        query = query.limit(limit)

    rows = session.execute(query).all()
    return [
        {
            "key": str(row.key),
            "views": int(row.views or 0),
            "visitors": int(row.visitors or 0),
        }
        for row in rows
    ]


def _returning_visitors(
    session: Session,
    start: datetime,
    end: datetime,
) -> int:
    active = (
        select(AnalyticsEvent.visitor_key.label("visitor_key"))
        .where(*_range_filter(start, end))
        .distinct()
        .subquery()
    )
    previous = (
        select(AnalyticsEvent.visitor_key.label("visitor_key"))
        .where(AnalyticsEvent.occurred_at < start)
        .distinct()
        .subquery()
    )
    count = session.scalar(
        select(func.count())
        .select_from(active)
        .join(previous, previous.c.visitor_key == active.c.visitor_key)
    )
    return int(count or 0)


def _trend(
    session: Session,
    date_from: date,
    date_to: date,
    start: datetime,
    end: datetime,
    timezone_name: str,
) -> list[dict[str, Any]]:
    day_expr = cast(
        func.timezone(timezone_name, AnalyticsEvent.occurred_at),
        Date,
    ).label("day")
    rows = session.execute(
        select(
            day_expr,
            func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
            func.count(distinct(AnalyticsEvent.session_key)).label("sessions"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == PAGE_VIEW)
            .label("page_views"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.event_type == CONTACT_CTA)
            .label("cta_clicks"),
            func.count(distinct(AnalyticsEvent.visitor_key))
            .filter(AnalyticsEvent.event_type == CONTACT_CTA)
            .label("cta_visitors"),
        )
        .where(*_range_filter(start, end))
        .group_by(day_expr)
        .order_by(day_expr)
    ).all()

    by_day = {row.day: row for row in rows}
    result: list[dict[str, Any]] = []
    cursor = date_from
    while cursor <= date_to:
        row = by_day.get(cursor)
        result.append(
            {
                "date": cursor.isoformat(),
                "visitors": int(row.visitors or 0) if row else 0,
                "sessions": int(row.sessions or 0) if row else 0,
                "page_views": int(row.page_views or 0) if row else 0,
                "cta_clicks": int(row.cta_clicks or 0) if row else 0,
                "cta_visitors": int(row.cta_visitors or 0) if row else 0,
            }
        )
        cursor += timedelta(days=1)
    return result


def _geography(
    session: Session,
    start: datetime,
    end: datetime,
) -> list[dict[str, Any]]:
    """Return map points without manufacturing coordinates through averaging.

    Browser coordinates and IP-derived coordinates are kept separate and grouped
    into configurable rounded coordinate cells. Grouping by the coordinate cell
    preserves real/provider-supplied points; it never calculates a synthetic
    midpoint for all visitors in the same city.
    """

    country_key = func.coalesce(AnalyticsEvent.country_code, UNKNOWN_LABEL).label(
        "country"
    )
    region_key = func.coalesce(AnalyticsEvent.region, UNKNOWN_LABEL).label("region")
    city_key = func.coalesce(AnalyticsEvent.city, UNKNOWN_LABEL).label("city")

    page_filter = AnalyticsEvent.event_type == PAGE_VIEW
    max_rows = _config_int("ANALYTICS_GEO_MAX_ROWS", 100, minimum=1)

    def coordinate_cells(source: str, decimals: int):
        decimals = min(max(decimals, 0), 6)
        latitude_cell = func.round(
            cast(AnalyticsEvent.latitude, Numeric),
            decimals,
        ).label("latitude")
        longitude_cell = func.round(
            cast(AnalyticsEvent.longitude, Numeric),
            decimals,
        ).label("longitude")

        if source == LOCATION_SOURCE_BROWSER:
            source_filter = AnalyticsEvent.geo_accuracy_m.is_not(None)
        elif source == LOCATION_SOURCE_IP:
            source_filter = AnalyticsEvent.geo_accuracy_m.is_(None)
        else:
            source_filter = AnalyticsEvent.latitude.is_(None)

        return session.execute(
            select(
                country_key,
                region_key,
                city_key,
                latitude_cell,
                longitude_cell,
                func.count(distinct(AnalyticsEvent.visitor_key)).label("visitors"),
                func.count(AnalyticsEvent.id).label("views"),
            )
            .where(
                *_range_filter(start, end),
                page_filter,
                source_filter,
                AnalyticsEvent.latitude.is_not(None),
                AnalyticsEvent.longitude.is_not(None),
            )
            .group_by(
                country_key,
                region_key,
                city_key,
                latitude_cell,
                longitude_cell,
            )
            .order_by(
                func.count(distinct(AnalyticsEvent.visitor_key)).desc(),
                func.count(AnalyticsEvent.id).desc(),
            )
            .limit(max_rows)
        ).all()

    browser_rows = coordinate_cells(
        LOCATION_SOURCE_BROWSER,
        _config_int("ANALYTICS_PRECISE_GEO_DECIMALS", 3, minimum=0),
    )
    ip_rows = coordinate_cells(
        LOCATION_SOURCE_IP,
        _config_int("ANALYTICS_IP_GEO_DECIMALS", 2, minimum=0),
    )

    geography: list[dict[str, Any]] = []
    for source, rows in (
        (LOCATION_SOURCE_BROWSER, browser_rows),
        (LOCATION_SOURCE_IP, ip_rows),
    ):
        for row in rows:
            geography.append(
                {
                    "source": source,
                    "country": row.country,
                    "region": row.region,
                    "city": row.city,
                    "latitude": float(row.latitude),
                    "longitude": float(row.longitude),
                    "visitors": int(row.visitors or 0),
                    "views": int(row.views or 0),
                }
            )

    geography.sort(
        key=lambda row: (row["visitors"], row["views"]),
        reverse=True,
    )
    return geography[:max_rows]


def _data_coverage(
    session: Session,
    start: datetime,
    end: datetime,
) -> dict[str, Any]:
    earliest, latest = session.execute(
        select(
            func.min(AnalyticsEvent.occurred_at),
            func.max(AnalyticsEvent.occurred_at),
        )
    ).one()

    requested_before_available_raw_data = earliest is not None and start < earliest

    return {
        "has_raw_data": earliest is not None,
        "earliest_raw_event": earliest.isoformat() if earliest else None,
        "latest_raw_event": latest.isoformat() if latest else None,
        "requested_range_starts_before_raw_data": requested_before_available_raw_data,
        "unique_visitor_kpis_are_raw_event_based": True,
        "note": (
            "Daily rollups cannot reconstruct exact unique visitors across a "
            "multi-day range; exact visitor/session KPIs therefore use raw events."
        ),
    }


def analytics_overview(
    session: Session,
    date_from: date,
    date_to: date,
    *,
    timezone_name: str = "Europe/Bucharest",
) -> dict[str, Any]:
    start, end = _bounds(date_from, date_to, timezone_name)
    previous_start, previous_end = _previous_bounds(
        date_from,
        date_to,
        timezone_name,
    )

    current = _scalar_metrics(session, start, end)
    previous = _scalar_metrics(session, previous_start, previous_end)

    collection_row = session.execute(
        select(
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.consent_granted.is_(True))
            .label("full_events"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.consent_granted.is_(False))
            .label("limited_events"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.consent_granted.is_(None))
            .label("unknown_consent_events"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.geo_accuracy_m.is_not(None))
            .label("browser_location_events"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.latitude.is_not(None), AnalyticsEvent.geo_accuracy_m.is_(None))
            .label("ip_location_events"),
            func.count(AnalyticsEvent.id)
            .filter(AnalyticsEvent.latitude.is_(None))
            .label("no_location_events"),
        ).where(*_range_filter(start, end))
    ).one()

    returning = _returning_visitors(session, start, end)
    current["returning_visitors"] = returning
    current["new_visitors"] = max(0, current["visitors"] - returning)
    current["cta_conversion"] = (
        round(current["cta_visitors"] * 100 / current["visitors"], 1)
        if current["visitors"]
        else 0.0
    )

    delta_keys = (
        "visitors",
        "sessions",
        "page_views",
        "cta_clicks",
        "cta_visitors",
    )
    deltas = {
        key: _percent_delta(current[key], previous[key])
        for key in delta_keys
    }

    page_view_filter = (AnalyticsEvent.event_type == PAGE_VIEW,)
    expose_raw_identifiers = _config_bool(
        "ANALYTICS_EXPOSE_RAW_IDENTIFIERS_IN_REPORTS",
        False,
    )

    return {
        "range": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
            "timezone": timezone_name,
        },
        "data_coverage": _data_coverage(session, start, end),
        "collection": {
            "enabled": Config.ANALYTICS_ENABLED,
            "require_consent": Config.ANALYTICS_REQUIRE_CONSENT,
            "raw_retention_days": Config.ANALYTICS_EVENT_RETENTION_DAYS,
            "aggregate_retention_days": Config.ANALYTICS_AGGREGATE_RETENTION_DAYS,
            "full_events": int(collection_row.full_events or 0),
            "limited_events": int(collection_row.limited_events or 0),
            "unknown_consent_events": int(
                collection_row.unknown_consent_events or 0
            ),
            "browser_location_events": int(
                collection_row.browser_location_events or 0
            ),
            "ip_location_events": int(collection_row.ip_location_events or 0),
            "no_location_events": int(collection_row.no_location_events or 0),
        },
        "kpis": {**current, "deltas": deltas},
        "trend": _trend(
            session,
            date_from,
            date_to,
            start,
            end,
            timezone_name,
        ),
        "top_pages": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.path,
            filters=page_view_filter,
            limit=20,
        ),
        "top_sections": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.section_id,
            filters=(AnalyticsEvent.event_type == SECTION_VIEW,),
            limit=20,
        ),
        "top_articles": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.target_type == "article",
            ),
            limit=20,
        ),
        "top_treatments": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.target_type == "treatment",
            ),
            limit=20,
        ),
        "top_offers": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.target_type == "offer",
            ),
            limit=20,
        ),
        "top_clinics": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.target_type == "clinic",
            ),
            limit=20,
        ),
        "contact_ctas": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.target_key,
            filters=(AnalyticsEvent.event_type == CONTACT_CTA,),
            limit=20,
        ),
        "referrers": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.referrer_host,
            filters=page_view_filter,
            limit=20,
        ),
        "devices": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.device_family,
            filters=page_view_filter,
        ),
        "browsers": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.browser_family,
            filters=page_view_filter,
        ),
        "operating_systems": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.os_family,
            filters=page_view_filter,
        ),
        "internet_providers": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.connection_isp,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.connection_isp.is_not(None),
            ),
            limit=20,
        ),
        "timezones": _dimension(
            session,
            start,
            end,
            AnalyticsEvent.timezone_name,
            filters=(
                AnalyticsEvent.event_type == PAGE_VIEW,
                AnalyticsEvent.timezone_name.is_not(None),
            ),
            limit=20,
        ),
        "ip_addresses": (
            _dimension(
                session,
                start,
                end,
                func.host(AnalyticsEvent.client_ip),
                filters=(
                    AnalyticsEvent.event_type == PAGE_VIEW,
                    AnalyticsEvent.client_ip.is_not(None),
                ),
                limit=20,
            )
            if expose_raw_identifiers
            else []
        ),
        "user_agents": (
            _dimension(
                session,
                start,
                end,
                AnalyticsEvent.user_agent,
                filters=(
                    AnalyticsEvent.event_type == PAGE_VIEW,
                    AnalyticsEvent.user_agent.is_not(None),
                ),
                limit=20,
            )
            if expose_raw_identifiers
            else []
        ),
        "geography": _geography(session, start, end),
    }


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------


def _csv_safe_cell(value: Any) -> Any:
    """Prevent spreadsheet formula injection in exported text cells."""

    if value is None or isinstance(value, (int, float, Decimal)):
        return value
    text = str(value)
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + text
    return text


def overview_csv(overview: dict[str, Any]) -> str:
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(
        [
            "data",
            "vizitatori",
            "sesiuni",
            "vizualizari_pagini",
            "clickuri_contact",
            "vizitatori_contact",
        ]
    )
    for row in overview.get("trend", []):
        writer.writerow(
            [
                row.get("date"),
                row.get("visitors", 0),
                row.get("sessions", 0),
                row.get("page_views", 0),
                row.get("cta_clicks", 0),
                row.get("cta_visitors", 0),
            ]
        )

    writer.writerow([])
    writer.writerow(["categorie", "element", "vizualizari", "vizitatori_unici"])
    dimension_categories = (
        "top_pages",
        "top_sections",
        "top_articles",
        "top_treatments",
        "top_offers",
        "top_clinics",
        "contact_ctas",
        "devices",
        "browsers",
        "operating_systems",
        "referrers",
        "internet_providers",
        "timezones",
        "ip_addresses",
        "user_agents",
    )
    for category in dimension_categories:
        for row in overview.get(category, []):
            writer.writerow(
                [
                    category,
                    _csv_safe_cell(row.get("key")),
                    row.get("views", 0),
                    row.get("visitors", 0),
                ]
            )

    writer.writerow([])
    writer.writerow(
        [
            "sursa_locatie",
            "tara",
            "regiune",
            "oras",
            "latitudine",
            "longitudine",
            "vizualizari",
            "vizitatori_unici",
        ]
    )
    for row in overview.get("geography", []):
        writer.writerow(
            [
                _csv_safe_cell(row.get("source")),
                _csv_safe_cell(row.get("country")),
                _csv_safe_cell(row.get("region")),
                _csv_safe_cell(row.get("city")),
                row.get("latitude"),
                row.get("longitude"),
                row.get("views", 0),
                row.get("visitors", 0),
            ]
        )

    return output.getvalue()


# ---------------------------------------------------------------------------
# Daily rollups and retention
# ---------------------------------------------------------------------------


def _rollup_lock_value(day: date, timezone_name: str) -> str:
    return f"{timezone_name}:{day.isoformat()}"


def rollup_day(
    session: Session,
    day: date,
    *,
    timezone_name: str = "Europe/Bucharest",
) -> int:
    """Rebuild a day's rollup atomically and remove stale dimension rows."""

    start, end = _bounds(day, day, timezone_name)
    _acquire_transaction_lock(
        session,
        "analytics-rollup",
        _rollup_lock_value(day, timezone_name),
    )

    metrics: list[dict[str, Any]] = []
    totals = _scalar_metrics(session, start, end)
    metrics.extend(
        {
            "day": day,
            "metric": metric,
            "dimension_type": "all",
            "dimension_key": "",
            "value": value,
        }
        for metric, value in totals.items()
    )

    page_view_filter = (AnalyticsEvent.event_type == PAGE_VIEW,)
    dimensions: tuple[tuple[str, Any, Sequence[Any]], ...] = (
        ("device", AnalyticsEvent.device_family, page_view_filter),
        ("browser", AnalyticsEvent.browser_family, page_view_filter),
        ("operating_system", AnalyticsEvent.os_family, page_view_filter),
        ("country", AnalyticsEvent.country_code, page_view_filter),
        ("page", AnalyticsEvent.path, page_view_filter),
        ("referrer", AnalyticsEvent.referrer_host, page_view_filter),
    )

    for dimension_name, column, filters in dimensions:
        for row in _dimension(
            session,
            start,
            end,
            column,
            filters=filters,
            limit=None,
        ):
            metrics.append(
                {
                    "day": day,
                    "metric": "views",
                    "dimension_type": dimension_name,
                    "dimension_key": row["key"],
                    "value": row["views"],
                }
            )
            metrics.append(
                {
                    "day": day,
                    "metric": "visitors",
                    "dimension_type": dimension_name,
                    "dimension_key": row["key"],
                    "value": row["visitors"],
                }
            )

    # Delete first so a rebuilt rollup cannot leave obsolete dimension keys.
    session.execute(delete(AnalyticsDailyMetric).where(AnalyticsDailyMetric.day == day))

    if metrics:
        batch_size = _config_int("ANALYTICS_ROLLUP_INSERT_BATCH_SIZE", 500, minimum=1)
        for offset in range(0, len(metrics), batch_size):
            batch = metrics[offset : offset + batch_size]
            statement = insert(AnalyticsDailyMetric).values(batch)
            statement = statement.on_conflict_do_update(
                constraint="pk_analytics_daily_metrics",
                set_={
                    "value": statement.excluded.value,
                    "updated_at": func.now(),
                },
            )
            session.execute(statement)

    return len(metrics)


def _days_with_raw_events_before(
    session: Session,
    cutoff: datetime,
    timezone_name: str,
) -> list[date]:
    day_expr = cast(
        func.timezone(timezone_name, AnalyticsEvent.occurred_at),
        Date,
    )
    days = session.scalars(
        select(day_expr)
        .where(AnalyticsEvent.occurred_at < cutoff)
        .distinct()
        .order_by(day_expr)
    ).all()
    return [day for day in days if day is not None]


def prune_retention(
    session: Session,
    *,
    now: datetime | None = None,
    timezone_name: str = "Europe/Bucharest",
) -> dict[str, int]:
    """Roll up complete local days, then prune raw and aggregate data.

    Deletion happens on local-day boundaries. This prevents a later rollup from
    overwriting a previously complete day with only the unpruned half of that day.
    """

    current_utc = _as_utc(now)
    tz = _timezone(timezone_name)
    local_today = current_utc.astimezone(tz).date()

    raw_retention_days = _config_int(
        "ANALYTICS_EVENT_RETENTION_DAYS",
        30,
        minimum=1,
    )
    aggregate_retention_days = _config_int(
        "ANALYTICS_AGGREGATE_RETENTION_DAYS",
        730,
        minimum=1,
    )

    # Retain exactly N local calendar dates, including today.
    first_retained_raw_day = local_today - timedelta(days=raw_retention_days - 1)
    raw_cutoff = datetime.combine(
        first_retained_raw_day,
        time.min,
        tzinfo=tz,
    ).astimezone(timezone.utc)

    days_to_roll_up = _days_with_raw_events_before(
        session,
        raw_cutoff,
        timezone_name,
    )
    rolled_up_metrics = 0
    for day in days_to_roll_up:
        rolled_up_metrics += rollup_day(
            session,
            day,
            timezone_name=timezone_name,
        )

    raw_deleted = session.execute(
        delete(AnalyticsEvent).where(AnalyticsEvent.occurred_at < raw_cutoff)
    ).rowcount or 0

    first_retained_aggregate_day = local_today - timedelta(
        days=aggregate_retention_days - 1
    )
    aggregate_deleted = session.execute(
        delete(AnalyticsDailyMetric).where(
            AnalyticsDailyMetric.day < first_retained_aggregate_day
        )
    ).rowcount or 0

    return {
        "days_rolled_up": len(days_to_roll_up),
        "metrics_rolled_up": int(rolled_up_metrics),
        "raw_events_deleted": int(raw_deleted),
        "daily_metrics_deleted": int(aggregate_deleted),
    }


# ---------------------------------------------------------------------------
# Erasure
# ---------------------------------------------------------------------------


def delete_visitor(session: Session, visitor_key_hex: str) -> int:
    """Delete raw events for a known pseudonymous visitor key.

    Daily rollups contain aggregate counts and cannot be exactly decremented
    after raw events are gone. They must therefore contain no visitor key or
    directly identifying value.
    """

    normalized = visitor_key_hex.strip()
    if len(normalized) != 64:
        return 0
    try:
        key = bytes.fromhex(normalized)
    except ValueError:
        return 0
    if len(key) != 32:
        return 0

    deleted = session.execute(
        delete(AnalyticsEvent).where(AnalyticsEvent.visitor_key == key)
    ).rowcount
    return int(deleted or 0)