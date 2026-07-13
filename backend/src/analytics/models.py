"""Storage models for first-party visitor analytics.

These tables intentionally have no foreign keys into content, audit, IAM, or patient
data. Content identifiers are historical labels: analytics must remain readable after
an editor renames or removes a public resource.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    Index,
    Integer,
    LargeBinary,
    Numeric,
    PrimaryKeyConstraint,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base

EVENT_TYPES = (
    "page_view",
    "navigation_click",
    "section_view",
    "article_read",
    "treatment_view",
    "offer_view",
    "clinic_view",
    "contact_cta",
)
TARGET_TYPES = ("page", "section", "article", "treatment", "offer", "clinic", "contact")
DEVICE_FAMILIES = ("desktop", "mobile", "tablet", "other")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('page_view','navigation_click','section_view','article_read',"
            "'treatment_view','offer_view','clinic_view','contact_cta')",
            name="ck_analytics_events_type",
        ),
        CheckConstraint(
            "path LIKE '/%' AND char_length(path) <= 300",
            name="ck_analytics_events_path",
        ),
        CheckConstraint(
            "target_type IS NULL OR target_type IN "
            "('page','section','article','treatment','offer','clinic','contact')",
            name="ck_analytics_events_target_type",
        ),
        CheckConstraint(
            "octet_length(visitor_key) = 32", name="ck_analytics_events_visitor_key"
        ),
        CheckConstraint(
            "octet_length(session_key) = 32", name="ck_analytics_events_session_key"
        ),
        CheckConstraint(
            "engaged_seconds IS NULL OR engaged_seconds BETWEEN 0 AND 3600",
            name="ck_analytics_events_engagement",
        ),
        CheckConstraint(
            "latitude IS NULL OR latitude BETWEEN -90 AND 90",
            name="ck_analytics_events_latitude",
        ),
        CheckConstraint(
            "longitude IS NULL OR longitude BETWEEN -180 AND 180",
            name="ck_analytics_events_longitude",
        ),
        CheckConstraint(
            "geo_accuracy_m IS NULL OR geo_accuracy_m BETWEEN 0 AND 100000",
            name="ck_analytics_events_geo_accuracy",
        ),
        Index(
            "ix_analytics_events_occurred_brin", "occurred_at", postgresql_using="brin"
        ),
        Index("ix_analytics_events_visitor_time", "visitor_key", "occurred_at"),
        Index("ix_analytics_events_session_time", "session_key", "occurred_at"),
        Index("ix_analytics_events_type_time", "event_type", "occurred_at"),
        Index("ix_analytics_events_path_time", "path", "occurred_at"),
        Index(
            "ix_analytics_events_target_time",
            "target_type",
            "target_key",
            "occurred_at",
        ),
        Index("ix_analytics_events_geo_time", "country_code", "region", "occurred_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    visitor_key: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    session_key: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    key_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    client_ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    consent_granted: Mapped[bool] = mapped_column(nullable=False, default=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    target_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    section_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer_host: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_family: Mapped[str] = mapped_column(Text, nullable=False)
    browser_family: Mapped[str] = mapped_column(Text, nullable=False)
    os_family: Mapped[str] = mapped_column(Text, nullable=False)
    country_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    country_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(Text, nullable=True)
    region_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(8, 5), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(8, 5), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    connection_asn: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    connection_isp: Mapped[str | None] = mapped_column(Text, nullable=True)
    geo_accuracy_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    engaged_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AnalyticsDailyMetric(Base):
    __tablename__ = "analytics_daily_metrics"
    __table_args__ = (
        PrimaryKeyConstraint(
            "day",
            "metric",
            "dimension_type",
            "dimension_key",
            name="pk_analytics_daily_metrics",
        ),
        CheckConstraint("value >= 0", name="ck_analytics_daily_metrics_value"),
        Index("ix_analytics_daily_metrics_metric_day", "metric", "day"),
    )

    day: Mapped[date] = mapped_column(Date, nullable=False)
    metric: Mapped[str] = mapped_column(Text, nullable=False)
    dimension_type: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'all'")
    )
    dimension_key: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    value: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
