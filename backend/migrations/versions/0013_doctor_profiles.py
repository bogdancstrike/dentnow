"""Expand doctor profiles with biography and supporting photography.

Revision ID: 0013_doctor_profiles
Revises: 0012_decontat_cas
"""
from alembic import op
import sqlalchemy as sa


revision = "0013_doctor_profiles"
down_revision = "0012_decontat_cas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("doctors", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("doctors", sa.Column("approach", sa.Text(), nullable=True))
    op.add_column("doctors", sa.Column("workspace_media_id", sa.Uuid(), nullable=True))
    op.add_column("doctors", sa.Column("secondary_media_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_doctors_workspace_media_id", "doctors", "media_assets",
        ["workspace_media_id"], ["id"], ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_doctors_secondary_media_id", "doctors", "media_assets",
        ["secondary_media_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_doctors_secondary_media_id", "doctors", type_="foreignkey")
    op.drop_constraint("fk_doctors_workspace_media_id", "doctors", type_="foreignkey")
    op.drop_column("doctors", "secondary_media_id")
    op.drop_column("doctors", "workspace_media_id")
    op.drop_column("doctors", "approach")
    op.drop_column("doctors", "description")
