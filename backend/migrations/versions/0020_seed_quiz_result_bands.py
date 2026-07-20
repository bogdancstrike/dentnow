"""Seed Admin-managed result messages for the existing hygiene quiz.

Revision ID: 0020_quiz_bands
Revises: 0019_seed_site_texts
"""
from __future__ import annotations

import json
from pathlib import Path
import uuid

from alembic import op
import sqlalchemy as sa


revision = "0020_quiz_bands"
down_revision = "0019_seed_site_texts"
branch_labels = None
depends_on = None


def _seed_values() -> list[dict]:
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "quiz-result-bands.json"
    return json.loads(seed_path.read_text(encoding="utf-8"))


def upgrade() -> None:
    bind = op.get_bind()
    quiz_id = bind.execute(sa.text(
        "SELECT id FROM quizzes WHERE slug = 'scor-igiena' AND deleted_at IS NULL LIMIT 1"
    )).scalar()
    if quiz_id is None:
        return
    existing = bind.execute(sa.text(
        "SELECT 1 FROM quiz_result_bands WHERE quiz_id = :quiz_id AND deleted_at IS NULL LIMIT 1"
    ), {"quiz_id": quiz_id}).scalar()
    if existing:
        return
    rows = [
        {
            "id": uuid.uuid4(),
            "quiz_id": quiz_id,
            "version": 1,
            "created_by": "migration:0020",
            "updated_by": "migration:0020",
            **band,
        }
        for band in _seed_values()
    ]
    result_bands = sa.table(
        "quiz_result_bands",
        sa.column("id", sa.Uuid()),
        sa.column("quiz_id", sa.Uuid()),
        sa.column("version", sa.BigInteger()),
        sa.column("created_by", sa.Text()),
        sa.column("updated_by", sa.Text()),
        sa.column("min_score", sa.Integer()),
        sa.column("max_score", sa.Integer()),
        sa.column("title", sa.Text()),
        sa.column("description", sa.Text()),
        sa.column("recommendations", sa.Text()),
    )
    op.bulk_insert(result_bands, rows)


def downgrade() -> None:
    op.execute(sa.text(
        "DELETE FROM quiz_result_bands WHERE created_by = 'migration:0020'"
    ))
