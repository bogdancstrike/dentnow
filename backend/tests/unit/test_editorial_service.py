"""Editorial service tests (DB-backed)."""
from __future__ import annotations

from datetime import date

import pytest
from pydantic import ValidationError as PydValidationError

from src.core.errors import ConflictError, ValidationError
from src.editorial.schemas import ReviewCreate
from src.editorial.service import (
    ArticleService,
    BandService,
    QuizService,
    ReviewService,
)
from src.iam.capabilities import ROLE_ADMIN
from src.iam.principal import Principal

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def test_article_unique_slug_and_html_render(db_session):
    svc = ArticleService(db_session, ADMIN)
    body, _ = svc.create({"slug": "prevention", "title": "Prevenție", "body_markdown": "**hi** <script>x</script>"})
    assert "<strong>hi</strong>" in body["body_html"]
    assert "<script" not in body["body_html"]
    with pytest.raises(ConflictError):
        svc.create({"slug": "prevention", "title": "Dup"})


def test_review_requires_exact_date_and_rating_range():
    # relative-only date is not accepted; a real date is required by the schema
    with pytest.raises(PydValidationError):
        ReviewCreate(author="Ana", rating=5)  # missing review_date
    with pytest.raises(PydValidationError):
        ReviewCreate(author="Ana", review_date=date(2026, 1, 1), rating=9)


def test_review_create(db_session):
    body, _ = ReviewService(db_session, ADMIN).create(
        {"author": "Ana", "review_date": "2026-01-15", "rating": 5, "source": "google"}
    )
    assert body["rating"] == 5
    assert body["review_date"] == "2026-01-15"


def test_quiz_band_overlap_rejected(db_session):
    quiz = QuizService(db_session, ADMIN).create({"slug": "igiena", "title": "Scor igienă"})[0]
    svc = BandService(db_session, ADMIN)
    svc.create({"quiz_id": quiz["id"], "min_score": 0, "max_score": 10, "title": "Low"})
    # overlapping band
    with pytest.raises(ConflictError):
        svc.create({"quiz_id": quiz["id"], "min_score": 5, "max_score": 15, "title": "Mid"})
    # adjacent non-overlapping band is fine
    ok, _ = svc.create({"quiz_id": quiz["id"], "min_score": 11, "max_score": 20, "title": "High"})
    assert ok["min_score"] == 11


def test_band_inverted_range_rejected(db_session):
    quiz = QuizService(db_session, ADMIN).create({"slug": "q2", "title": "Q2"})[0]
    with pytest.raises(ValidationError):
        BandService(db_session, ADMIN).create({"quiz_id": quiz["id"], "min_score": 20, "max_score": 5, "title": "Bad"})
