"""Add google_place_id to clinics

Revision ID: 0009_clinic_google_place_id
Revises: 0008_home_cards
"""
from alembic import op
import sqlalchemy as sa


revision = "0009_clinic_google_place_id"
down_revision = "0008_home_cards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clinics", sa.Column("google_place_id", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("clinics", "google_place_id")
