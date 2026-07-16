"""Add site_texts (admin-editable overrides for hardcoded public copy)

Revision ID: 0018_site_texts
Revises: 0017_analytics_ip_geolocation
"""
from alembic import op
import sqlalchemy as sa


revision = "0018_site_texts"
down_revision = "0017_analytics_ip_geolocation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "site_texts",
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_site_texts_key_live",
        "site_texts",
        ["key"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_site_texts_key_live", table_name="site_texts")
    op.drop_table("site_texts")
