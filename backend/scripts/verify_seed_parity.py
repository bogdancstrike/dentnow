"""Verify the seeded database matches the expected content inventory."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select  # noqa: E402

import src.models_all  # noqa: E402,F401
from src.catalog.models import Offer, Partner, Treatment, TreatmentCategory, TreatmentPrice  # noqa: E402
from src.clinics.models import Clinic, ClinicContact  # noqa: E402
from src.core.db import session_scope  # noqa: E402
from src.editorial.models import (  # noqa: E402
    Article, CaseStudy, Ebook, NewsItem, QuizOption, QuizQuestion, Review,
)

EXPECTED = {
    "clinics": 3, "phone_lines": 2, "services": 6, "offers": 6,
    "treatment_categories": 10, "treatment_price_rows": 20, "partners": 6,
    "case_studies": 3, "ebooks": 6, "news_items": 3, "quiz_questions": 7,
    "quiz_options": 28, "articles": 17, "reviews": 9,
}


def actual_counts(session) -> dict:
    def n(model, *where):
        q = select(func.count()).select_from(model)
        for w in where:
            q = q.where(w)
        return session.scalar(q) or 0

    return {
        "clinics": n(Clinic, Clinic.deleted_at.is_(None)),
        "phone_lines": session.scalar(
            select(func.count(func.distinct(ClinicContact.normalized_value))).where(ClinicContact.kind == "phone")
        ) or 0,
        "services": n(Treatment, Treatment.slug.like("service-%"), Treatment.deleted_at.is_(None)),
        "offers": n(Offer, Offer.deleted_at.is_(None)),
        "treatment_categories": n(TreatmentCategory, TreatmentCategory.deleted_at.is_(None)),
        "treatment_price_rows": n(TreatmentPrice, TreatmentPrice.deleted_at.is_(None)),
        "partners": n(Partner, Partner.deleted_at.is_(None)),
        "case_studies": n(CaseStudy, CaseStudy.deleted_at.is_(None)),
        "ebooks": n(Ebook, Ebook.deleted_at.is_(None)),
        "news_items": n(NewsItem, NewsItem.deleted_at.is_(None)),
        "quiz_questions": n(QuizQuestion, QuizQuestion.deleted_at.is_(None)),
        "quiz_options": n(QuizOption, QuizOption.deleted_at.is_(None)),
        "articles": n(Article, Article.deleted_at.is_(None)),
        "reviews": n(Review, Review.deleted_at.is_(None)),
    }


def check(session) -> list[str]:
    actual = actual_counts(session)
    mismatches = [
        f"{k}: expected {EXPECTED[k]}, got {actual.get(k)}"
        for k in EXPECTED
        if actual.get(k) != EXPECTED[k]
    ]
    return mismatches


def main() -> int:
    with session_scope() as session:
        mismatches = check(session)
    if mismatches:
        print("PARITY FAILED:\n  " + "\n  ".join(mismatches))
        return 1
    print("PARITY OK: all inventory counts match")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
