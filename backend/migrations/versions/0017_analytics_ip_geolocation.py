"""Store IP-derived analytics geolocation and network metadata.

Revision ID: 0017_analytics_ip_geolocation
Revises: 0016_tiered_analytics_consent
"""

from alembic import op
import sqlalchemy as sa


revision = "0017_analytics_ip_geolocation"
down_revision = "0016_tiered_analytics_consent"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analytics_events", sa.Column("country_name", sa.Text(), nullable=True)
    )
    op.add_column(
        "analytics_events", sa.Column("region_code", sa.Text(), nullable=True)
    )
    op.add_column(
        "analytics_events", sa.Column("postal_code", sa.Text(), nullable=True)
    )
    op.add_column(
        "analytics_events", sa.Column("timezone_name", sa.Text(), nullable=True)
    )
    op.add_column(
        "analytics_events", sa.Column("connection_asn", sa.BigInteger(), nullable=True)
    )
    op.add_column(
        "analytics_events", sa.Column("connection_isp", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("analytics_events", "connection_isp")
    op.drop_column("analytics_events", "connection_asn")
    op.drop_column("analytics_events", "timezone_name")
    op.drop_column("analytics_events", "postal_code")
    op.drop_column("analytics_events", "region_code")
    op.drop_column("analytics_events", "country_name")
