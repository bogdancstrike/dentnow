"""Add first-party visitor analytics storage.

Revision ID: 0015_visitor_analytics
Revises: 0014_manual_reviews
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0015_visitor_analytics"
down_revision = "0014_manual_reviews"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("visitor_key", sa.LargeBinary(length=32), nullable=False),
        sa.Column("session_key", sa.LargeBinary(length=32), nullable=False),
        sa.Column("key_version", sa.Integer(), nullable=False),
        sa.Column("client_ip", postgresql.INET(), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("path", sa.Text(), nullable=False),
        sa.Column("target_type", sa.Text(), nullable=True),
        sa.Column("target_key", sa.Text(), nullable=True),
        sa.Column("section_id", sa.Text(), nullable=True),
        sa.Column("referrer_host", sa.Text(), nullable=True),
        sa.Column("device_family", sa.Text(), nullable=False),
        sa.Column("browser_family", sa.Text(), nullable=False),
        sa.Column("os_family", sa.Text(), nullable=False),
        sa.Column("country_code", sa.Text(), nullable=True),
        sa.Column("region", sa.Text(), nullable=True),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Numeric(8, 5), nullable=True),
        sa.Column("longitude", sa.Numeric(8, 5), nullable=True),
        sa.Column("geo_accuracy_m", sa.Integer(), nullable=True),
        sa.Column("engaged_seconds", sa.Integer(), nullable=True),
        sa.CheckConstraint("event_type IN ('page_view','navigation_click','section_view','article_read','treatment_view','offer_view','clinic_view','contact_cta')", name="ck_analytics_events_type"),
        sa.CheckConstraint("path LIKE '/%' AND char_length(path) <= 300", name="ck_analytics_events_path"),
        sa.CheckConstraint("target_type IS NULL OR target_type IN ('page','section','article','treatment','offer','clinic','contact')", name="ck_analytics_events_target_type"),
        sa.CheckConstraint("octet_length(visitor_key) = 32", name="ck_analytics_events_visitor_key"),
        sa.CheckConstraint("octet_length(session_key) = 32", name="ck_analytics_events_session_key"),
        sa.CheckConstraint("engaged_seconds IS NULL OR engaged_seconds BETWEEN 0 AND 3600", name="ck_analytics_events_engagement"),
        sa.CheckConstraint("latitude IS NULL OR latitude BETWEEN -90 AND 90", name="ck_analytics_events_latitude"),
        sa.CheckConstraint("longitude IS NULL OR longitude BETWEEN -180 AND 180", name="ck_analytics_events_longitude"),
        sa.CheckConstraint("geo_accuracy_m IS NULL OR geo_accuracy_m BETWEEN 0 AND 100000", name="ck_analytics_events_geo_accuracy"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analytics_events_occurred_brin", "analytics_events", ["occurred_at"], postgresql_using="brin")
    op.create_index("ix_analytics_events_visitor_time", "analytics_events", ["visitor_key", "occurred_at"])
    op.create_index("ix_analytics_events_session_time", "analytics_events", ["session_key", "occurred_at"])
    op.create_index("ix_analytics_events_type_time", "analytics_events", ["event_type", "occurred_at"])
    op.create_index("ix_analytics_events_path_time", "analytics_events", ["path", "occurred_at"])
    op.create_index("ix_analytics_events_target_time", "analytics_events", ["target_type", "target_key", "occurred_at"])
    op.create_index("ix_analytics_events_geo_time", "analytics_events", ["country_code", "region", "occurred_at"])

    op.create_table(
        "analytics_daily_metrics",
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("metric", sa.Text(), nullable=False),
        sa.Column("dimension_type", sa.Text(), server_default=sa.text("'all'"), nullable=False),
        sa.Column("dimension_key", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("value", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("value >= 0", name="ck_analytics_daily_metrics_value"),
        sa.PrimaryKeyConstraint("day", "metric", "dimension_type", "dimension_key", name="pk_analytics_daily_metrics"),
    )
    op.create_index("ix_analytics_daily_metrics_metric_day", "analytics_daily_metrics", ["metric", "day"])


def downgrade() -> None:
    op.drop_index("ix_analytics_daily_metrics_metric_day", table_name="analytics_daily_metrics")
    op.drop_table("analytics_daily_metrics")
    for name in (
        "ix_analytics_events_geo_time", "ix_analytics_events_target_time",
        "ix_analytics_events_path_time", "ix_analytics_events_type_time",
        "ix_analytics_events_session_time", "ix_analytics_events_visitor_time",
        "ix_analytics_events_occurred_brin",
    ):
        op.drop_index(name, table_name="analytics_events")
    op.drop_table("analytics_events")
