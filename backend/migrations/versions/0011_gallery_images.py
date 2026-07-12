"""Add gallery_images (clinic space carousel) + seed placeholders

Revision ID: 0011_gallery_images
Revises: 0010_homepage_services
"""
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0011_gallery_images"
down_revision = "0010_homepage_services"
branch_labels = None
depends_on = None


_A = "/assets/dentnow/"
DEFAULTS = [
    (_A + "clinic-exterior.svg", "Clinica DentNow", "Acces facil, aproape de mijloacele de transport in comun.", "Ilustratie cu exteriorul clinicii DentNow din Bucuresti"),
    (_A + "reception.svg", "Receptie si orientare", "Primul contact trebuie sa confirme adresa, programul si pasii vizitei.", "Placeholder pentru receptia DentNow"),
    (_A + "treatment-room.svg", "Cabinet modern", "Spatiu clinic curat, organizat si pregatit pentru tratamente.", "Placeholder pentru cabinet stomatologic modern"),
    (_A + "sterilization.svg", "Sterilizare", "Protocol strict de sterilizare si trasabilitate a instrumentarului.", "Ilustratie cu zona de sterilizare"),
    (_A + "airflow.svg", "GBT / EMS Airflow", "Igienizare blanda si controlata pentru pacienti.", "Placeholder pentru echipament EMS Guided Biofilm Therapy"),
    (_A + "microscope.svg", "Microscop dentar", "Pentru tratamente de canal si lucrari care necesita precizie.", "Placeholder pentru microscop dentar Carl Zeiss"),
]


def upgrade() -> None:
    gallery = op.create_table(
        "gallery_images",
        sa.Column("media_id", sa.Uuid(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("alt_text", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["media_id"], ["media_assets.id"], name="fk_gallery_images_media_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gallery_images_position", "gallery_images", ["position"])

    op.bulk_insert(
        gallery,
        [
            {
                "id": uuid.uuid4(),
                "media_id": None,
                "image_url": url,
                "title": title,
                "caption": caption,
                "alt_text": alt,
                "position": i,
                "active": True,
                "version": 1,
                "created_by": "seed",
                "updated_by": "seed",
            }
            for i, (url, title, caption, alt) in enumerate(DEFAULTS)
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_gallery_images_position", table_name="gallery_images")
    op.drop_table("gallery_images")
