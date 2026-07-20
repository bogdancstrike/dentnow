"""Move static public-page SEO into Admin-managed page metadata.

Revision ID: 0021_seed_page_seo
Revises: 0020_quiz_bands
"""
from __future__ import annotations

import json
from pathlib import Path
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0021_seed_page_seo"
down_revision = "0020_quiz_bands"
branch_labels = None
depends_on = None


def _seed_values() -> dict[str, dict[str, str]]:
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "page-seo.json"
    return json.loads(seed_path.read_text(encoding="utf-8"))


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text(
        "UPDATE pages SET enabled = FALSE, version = version + 1, "
        "updated_by = 'migration:0021' "
        "WHERE path IN ('/implant-dentar-bucuresti', '/aparat-dentar-dristor', "
        "'/albire-dentara-laser', '/protetica-zirconiu') AND deleted_at IS NULL"
    ))
    seeds = _seed_values()
    pages = dict(bind.execute(sa.text(
        "SELECT path, id FROM pages WHERE deleted_at IS NULL"
    )).all())

    if "/recenzie" not in pages:
        page_id = uuid.uuid4()
        pages_table = sa.table(
            "pages",
            sa.column("id", sa.Uuid()),
            sa.column("path", sa.Text()),
            sa.column("route_key", sa.Text()),
            sa.column("template_key", sa.Text()),
            sa.column("title", sa.Text()),
            sa.column("enabled", sa.Boolean()),
            sa.column("indexable", sa.Boolean()),
            sa.column("version", sa.BigInteger()),
            sa.column("created_by", sa.Text()),
            sa.column("updated_by", sa.Text()),
        )
        op.bulk_insert(pages_table, [{
            "id": page_id,
            "path": "/recenzie",
            "route_key": "review-redirect",
            "template_key": "generic",
            "title": "Lasă o recenzie",
            "enabled": True,
            "indexable": False,
            "version": 1,
            "created_by": "migration:0021",
            "updated_by": "migration:0021",
        }])
        pages["/recenzie"] = page_id

    existing_page_ids = set(bind.execute(sa.text(
        "SELECT page_id FROM page_seo WHERE deleted_at IS NULL"
    )).scalars())
    rows = [
        {
            "id": uuid.uuid4(),
            "page_id": pages[path],
            "title": value["title"],
            "description": value["description"],
            "canonical_path": path,
            "version": 1,
            "created_by": "migration:0021",
            "updated_by": "migration:0021",
        }
        for path, value in seeds.items()
        if path in pages and pages[path] not in existing_page_ids
    ]
    if not rows:
        return
    seo_table = sa.table(
        "page_seo",
        sa.column("id", sa.Uuid()),
        sa.column("page_id", sa.Uuid()),
        sa.column("title", sa.Text()),
        sa.column("description", sa.Text()),
        sa.column("canonical_path", sa.Text()),
        sa.column("version", sa.BigInteger()),
        sa.column("created_by", sa.Text()),
        sa.column("updated_by", sa.Text()),
    )
    op.bulk_insert(seo_table, rows)


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM page_seo WHERE created_by = 'migration:0021'"))
    op.execute(sa.text("DELETE FROM pages WHERE created_by = 'migration:0021'"))
    op.execute(sa.text(
        "UPDATE pages SET enabled = TRUE, version = version + 1 "
        "WHERE path IN ('/implant-dentar-bucuresti', '/aparat-dentar-dristor', "
        "'/albire-dentara-laser', '/protetica-zirconiu') AND updated_by = 'migration:0021'"
    ))
