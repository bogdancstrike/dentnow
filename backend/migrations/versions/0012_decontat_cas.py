"""Add cas_steps + cas_faqs (decontat-cas page) + seed defaults

Revision ID: 0012_decontat_cas
Revises: 0011_gallery_images
"""
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0012_decontat_cas"
down_revision = "0011_gallery_images"
branch_labels = None
depends_on = None


STEPS = [
    ("Sună și programează-te", "Menționează la telefon că dorești o consultație decontată CAS, iar noi verificăm plafonul disponibil pentru luna în curs."),
    ("Vino cu actele necesare", "Prezinți la recepție cartea de identitate și dovada de asigurat (pentru copii: certificatul de naștere și buletinul părintelui)."),
    ("Beneficiezi de tratament", "Decontarea se face direct de către clinică prin contractul cu CAS — nu depui niciun dosar și nu aștepți rambursări."),
]

FAQS = [
    ("Ce acte îmi trebuie pentru o programare decontată CAS?", "Pentru adulți: cartea de identitate și dovada calității de asigurat (adeverință de salariat, talon de pensie sau card de sănătate). Pentru copii: certificatul de naștere sau cartea de identitate (peste 14 ani) și buletinul unuia dintre părinți."),
    ("Tratamentele pentru copii sunt într-adevăr gratuite?", "Da. Copiii cu vârsta de până la 18 ani beneficiază de consultații, obturații (plombe), sigilări și extracții ale dinților temporari decontate integral prin CAS, fără niciun cost pentru părinți."),
    ("Am nevoie de trimitere de la medicul de familie?", "Nu. Pentru serviciile stomatologice decontate prin CAS nu este necesară trimitere de la medicul de familie — este suficient să te programezi telefonic și să prezinți actele la recepție."),
    ("Ce înseamnă plafonul lunar CAS și de ce contează?", "Fiecare clinică aflată în contract cu CAS primește un fond lunar limitat pentru decontări. Odată epuizat plafonul, tratamentele decontate se reiau luna următoare — de aceea recomandăm programarea la începutul lunii."),
    ("În care dintre clinicile DentNow pot beneficia de decontare?", "Decontarea CAS este disponibilă în toate cele trei clinici DentNow din București: Dristor, Baba Novac și Prelungirea Ghencea."),
]


def _root_cols():
    return [
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def _root_vals(extra, i):
    return {**extra, "position": i, "active": True, "id": uuid.uuid4(), "version": 1, "created_by": "seed", "updated_by": "seed"}


def upgrade() -> None:
    steps = op.create_table(
        "cas_steps",
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        *_root_cols(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cas_steps_position", "cas_steps", ["position"])
    faqs = op.create_table(
        "cas_faqs",
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        *_root_cols(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cas_faqs_position", "cas_faqs", ["position"])

    op.bulk_insert(steps, [_root_vals({"title": t, "text": x}, i) for i, (t, x) in enumerate(STEPS)])
    op.bulk_insert(faqs, [_root_vals({"question": q, "answer": a}, i) for i, (q, a) in enumerate(FAQS)])


def downgrade() -> None:
    op.drop_index("ix_cas_faqs_position", table_name="cas_faqs")
    op.drop_table("cas_faqs")
    op.drop_index("ix_cas_steps_position", table_name="cas_steps")
    op.drop_table("cas_steps")
