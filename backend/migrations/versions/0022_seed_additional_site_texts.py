"""Seed newly audited public copy as Admin-managed site texts.

Revision ID: 0022_more_site_texts
Revises: 0021_seed_page_seo
"""
from __future__ import annotations

import json
from pathlib import Path
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0022_more_site_texts"
down_revision = "0021_seed_page_seo"
branch_labels = None
depends_on = None


def _seed_values() -> dict[str, str]:
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "site-texts.json"
    return json.loads(seed_path.read_text(encoding="utf-8"))


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(bind.execute(sa.text(
        "SELECT key FROM site_texts WHERE deleted_at IS NULL"
    )).scalars())
    rows = [
        {
            "id": uuid.uuid4(),
            "key": key,
            "value": value,
            "version": 1,
            "created_by": "migration:0022",
            "updated_by": "migration:0022",
        }
        for key, value in _seed_values().items()
        if key not in existing
    ]
    if rows:
        site_texts = sa.table(
            "site_texts",
            sa.column("id", sa.Uuid()),
            sa.column("key", sa.Text()),
            sa.column("value", sa.Text()),
            sa.column("version", sa.BigInteger()),
            sa.column("created_by", sa.Text()),
            sa.column("updated_by", sa.Text()),
        )
        op.bulk_insert(site_texts, rows)


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM site_texts WHERE created_by = 'migration:0022'"))
