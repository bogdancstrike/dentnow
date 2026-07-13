"""Retain limited analytics when full consent is unavailable.

Revision ID: 0016_tiered_analytics_consent
Revises: 0015_visitor_analytics
"""

from alembic import op
import sqlalchemy as sa


revision = "0016_tiered_analytics_consent"
down_revision = "0015_visitor_analytics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analytics_events",
        sa.Column("consent_granted", sa.Boolean(), nullable=True),
    )
    # Events written before this migration passed the former consent gate.
    op.execute("UPDATE analytics_events SET consent_granted = true")
    op.alter_column(
        "analytics_events",
        "consent_granted",
        nullable=False,
        server_default=sa.false(),
    )
    op.alter_column("analytics_events", "client_ip", nullable=True)
    op.alter_column("analytics_events", "user_agent", nullable=True)


def downgrade() -> None:
    op.execute(
        "UPDATE analytics_events "
        "SET client_ip = COALESCE(client_ip, '0.0.0.0'), "
        "user_agent = COALESCE(user_agent, 'Not retained')"
    )
    op.alter_column("analytics_events", "user_agent", nullable=False)
    op.alter_column("analytics_events", "client_ip", nullable=False)
    op.drop_column("analytics_events", "consent_granted")
