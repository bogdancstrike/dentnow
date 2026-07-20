"""Verify the seeded database matches the expected content inventory."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select  # noqa: E402

import src.models_all  # noqa: E402,F401
from src.catalog.models import (  # noqa: E402
    Offer, Partner, Treatment, TreatmentCategory, TreatmentFaq, TreatmentPrice,
)
from src.clinics.models import (  # noqa: E402
    Clinic, ClinicContact, ClinicFaq, ClinicTransitItem,
)
from src.core.db import session_scope  # noqa: E402
from src.editorial.models import (  # noqa: E402
    Article, CaseStudy, Ebook, LegalDocument, NewsItem, QuizOption, QuizQuestion, Review,
)
from src.media.models import MediaAsset  # noqa: E402
from src.site.models import (  # noqa: E402
    CasFaq, CasStep, GalleryImage, HomepageService, NavigationItem, Page, PageSection, PageSeo,
)

SEED_FIXTURE = Path(__file__).resolve().parents[1] / "seeds" / "current-site.json"


def _navigation_item_count(items: list[dict]) -> int:
    return sum(1 + _navigation_item_count(item.get("children", [])) for item in items)


_seed_data = json.loads(SEED_FIXTURE.read_text(encoding="utf-8"))
_expected_navigation_items = sum(
    _navigation_item_count(_seed_data.get("navigation", {}).get(menu_key, []))
    for menu_key in ("desktop", "mobile")
)

EXPECTED = {
    "clinics": 3, "phone_lines": 2, "services": 6, "offers": 6,
    "treatment_categories": 10, "treatment_price_rows": 20, "partners": 6,
    "case_studies": 3, "ebooks": 6, "news_items": 3, "quiz_questions": 7,
    "quiz_options": 28, "articles": 17, "reviews": 9,
    "media_assets": 1, "navigation_items": _expected_navigation_items,
    "clinic_transit_items": 9, "clinic_faqs": 7,
    "homepage_services": 6, "gallery_images": 6, "cas_steps": 3, "cas_faqs": 5,
    "detailed_treatments": 4, "treatment_faqs": 8,
    "pages": 19, "page_seo": 19, "page_sections": 22, "legal_documents": 3,
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
        "media_assets": n(MediaAsset, MediaAsset.deleted_at.is_(None)),
        "navigation_items": n(NavigationItem, NavigationItem.deleted_at.is_(None)),
        "clinic_transit_items": n(ClinicTransitItem, ClinicTransitItem.deleted_at.is_(None)),
        "clinic_faqs": n(ClinicFaq, ClinicFaq.deleted_at.is_(None)),
        "homepage_services": n(HomepageService, HomepageService.deleted_at.is_(None)),
        "gallery_images": n(GalleryImage, GalleryImage.deleted_at.is_(None)),
        "cas_steps": n(CasStep, CasStep.deleted_at.is_(None)),
        "cas_faqs": n(CasFaq, CasFaq.deleted_at.is_(None)),
        "detailed_treatments": n(
            Treatment,
            Treatment.slug.in_((
                "implant-dentar-bucuresti", "aparat-dentar-dristor",
                "albire-dentara-laser", "protetica-zirconiu",
            )),
            Treatment.deleted_at.is_(None),
        ),
        "treatment_faqs": n(TreatmentFaq, TreatmentFaq.deleted_at.is_(None)),
        "pages": n(Page, Page.deleted_at.is_(None)),
        "page_seo": n(PageSeo, PageSeo.deleted_at.is_(None)),
        "page_sections": n(PageSection, PageSection.deleted_at.is_(None)),
        "legal_documents": n(LegalDocument, LegalDocument.deleted_at.is_(None)),
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
