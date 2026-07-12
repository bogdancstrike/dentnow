"""Homepage treatment cards and clinic-level social contacts.

Revision ID: 0008_home_cards
Revises: 0007_publication_guards
"""
from alembic import op
import sqlalchemy as sa


revision = "0008_home_cards"
down_revision = "0007_publication_guards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("treatments", sa.Column("homepage_featured", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("treatments", sa.Column("homepage_label", sa.Text(), nullable=True))
    op.add_column("treatments", sa.Column("homepage_icon", sa.Text(), nullable=True))
    op.drop_constraint("ck_clinic_contacts_kind", "clinic_contacts", type_="check")
    op.create_check_constraint(
        "ck_clinic_contacts_kind",
        "clinic_contacts",
        "kind IN ('phone','whatsapp','email','booking','social')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_clinic_contacts_kind", "clinic_contacts", type_="check")
    op.create_check_constraint(
        "ck_clinic_contacts_kind",
        "clinic_contacts",
        "kind IN ('phone','whatsapp','email','booking')",
    )
    op.drop_column("treatments", "homepage_icon")
    op.drop_column("treatments", "homepage_label")
    op.drop_column("treatments", "homepage_featured")
