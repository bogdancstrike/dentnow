"""Remove automatic Google Places review configuration.

Revision ID: 0014_manual_reviews
Revises: 0013_doctor_profiles
"""
from alembic import op
import sqlalchemy as sa


revision = "0014_manual_reviews"
down_revision = "0013_doctor_profiles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("clinics", "google_place_id")


def downgrade() -> None:
    op.add_column(
        "clinics",
        sa.Column("google_place_id", sa.String(length=255), nullable=True),
    )
