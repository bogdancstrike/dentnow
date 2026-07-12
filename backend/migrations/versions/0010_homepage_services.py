"""Add homepage_services (Tratamente uzuale cards) + seed defaults

Revision ID: 0010_homepage_services
Revises: 0009_clinic_google_place_id
"""
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0010_homepage_services"
down_revision = "0009_clinic_google_place_id"
branch_labels = None
depends_on = None


DEFAULTS = [
    ("01", "Implanturi Dentare", "Solutii pentru dinti lipsa, cu plan chirurgical si deviz explicat inainte de tratament.", "/tratamente#implanturi"),
    ("02", "Igienizare GBT", "Protocol modern pentru biofilm, tartru si preventie, cu accent pe confortul pacientului.", "/tratamente#igienizare"),
    ("03", "Albire BlancOne Click", "Albire profesionala in cabinet, cu indicatii clare si asteptari realiste.", "/tratamente#albire"),
    ("04", "Ortodontie", "Aparate metalice sau alignere transparente, alese dupa consult si diagnostic.", "/tratamente#ortodontie"),
    ("05", "Obturații & Endodonție", "Restaurari estetice si tratamente de canal cu lupa sau microscop, in functie de caz.", "/tratamente#obturatii"),
    ("06", "Pedodontie", "Tratament prietenos pentru copii, cu explicatii pentru parinti si suport CAS unde se aplica.", "/tratamente#pediatrie"),
]


def upgrade() -> None:
    services = op.create_table(
        "homepage_services",
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.Text(), nullable=True),
        sa.Column("link", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_homepage_services_position", "homepage_services", ["position"])

    op.bulk_insert(
        services,
        [
            {
                "id": uuid.uuid4(),
                "title": title,
                "description": desc,
                "icon": icon,
                "link": link,
                "position": i,
                "active": True,
                "version": 1,
                "created_by": "seed",
                "updated_by": "seed",
            }
            for i, (icon, title, desc, link) in enumerate(DEFAULTS)
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_homepage_services_position", table_name="homepage_services")
    op.drop_table("homepage_services")
