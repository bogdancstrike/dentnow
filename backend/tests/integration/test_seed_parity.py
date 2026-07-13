"""Seed parity — runs against a freshly-seeded DB (compose `seed` flow).

Opt-in via RUN_SEED_TESTS=1 because the seed commits fixed slugs that would collide
with the unit-test fixtures on the shared host database.
"""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_SEED_TESTS") != "1",
    reason="RUN_SEED_TESTS != 1 (seed parity runs on a freshly seeded DB)",
)


def test_inventory_counts_match_expected():
    from scripts.verify_seed_parity import check
    from src.core.db import session_scope

    with session_scope() as session:
        mismatches = check(session)
    assert mismatches == [], "parity mismatches:\n" + "\n".join(mismatches)


def test_migration_baseline_publication_is_active():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.site.models import SitePublication, SiteState

    with session_scope() as session:
        pub = session.scalar(
            select(SitePublication).where(SitePublication.activation_reason == "migration_baseline")
        )
        assert pub is not None
        state = session.get(SiteState, 1)
        assert state.active_publication_id == pub.id


def test_no_route_from_inventory_is_missing():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.site.models import Page

    from scripts.seed_current_site import ROUTES

    required = {path for path, _key, _template, _title in ROUTES}
    with session_scope() as session:
        paths = {p for (p,) in session.execute(select(Page.path)).all()}
    assert required <= paths, f"missing routes: {required - paths}"


def test_seeded_clinics_include_transit_and_faq_content():
    from sqlalchemy import func, select

    from src.clinics.models import Clinic, ClinicFaq, ClinicTransitItem
    from src.core.db import session_scope

    with session_scope() as session:
        clinics = session.scalars(select(Clinic).where(Clinic.deleted_at.is_(None))).all()
        for clinic in clinics:
            transit_count = session.scalar(
                select(func.count()).select_from(ClinicTransitItem).where(
                    ClinicTransitItem.clinic_id == clinic.id,
                    ClinicTransitItem.deleted_at.is_(None),
                )
            )
            faq_count = session.scalar(
                select(func.count()).select_from(ClinicFaq).where(
                    ClinicFaq.clinic_id == clinic.id,
                    ClinicFaq.deleted_at.is_(None),
                )
            )
            assert transit_count, f"{clinic.slug} has no transit directions"
            assert faq_count, f"{clinic.slug} has no FAQs"


def test_seeded_treatment_detail_routes_have_content_and_faqs():
    from sqlalchemy import func, select

    from src.catalog.models import Treatment, TreatmentFaq
    from src.core.db import session_scope

    expected = {
        "implant-dentar-bucuresti",
        "aparat-dentar-dristor",
        "albire-dentara-laser",
        "protetica-zirconiu",
    }
    with session_scope() as session:
        treatments = session.scalars(
            select(Treatment).where(Treatment.slug.in_(expected), Treatment.deleted_at.is_(None))
        ).all()
        assert {t.slug for t in treatments} == expected
        for treatment in treatments:
            assert treatment.summary
            assert treatment.detail_markdown
            faq_count = session.scalar(
                select(func.count()).select_from(TreatmentFaq).where(
                    TreatmentFaq.treatment_id == treatment.id,
                    TreatmentFaq.deleted_at.is_(None),
                )
            )
            assert faq_count, f"{treatment.slug} has no FAQs"


def test_seeded_page_local_content_and_seo_are_queryable():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.site.models import Page, PageSection, PageSeo

    required = {"/", "/decontat-cas", "/urgente-dentare-bucuresti"}
    with session_scope() as session:
        pages = session.scalars(select(Page).where(Page.path.in_(required))).all()
        assert {page.path for page in pages} == required
        for page in pages:
            assert session.scalar(
                select(PageSection.id).where(
                    PageSection.page_id == page.id,
                    PageSection.deleted_at.is_(None),
                ).limit(1)
            ) is not None, f"{page.path} has no page sections"
            seo = session.scalar(
                select(PageSeo).where(PageSeo.page_id == page.id, PageSeo.deleted_at.is_(None))
            )
            assert seo is not None, f"{page.path} has no SEO row"
            assert seo.title and seo.description


def test_seeded_legal_documents_are_complete_not_placeholders():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.editorial.models import LegalDocument

    with session_scope() as session:
        documents = session.scalars(
            select(LegalDocument).where(LegalDocument.deleted_at.is_(None))
        ).all()
    assert {document.doc_type for document in documents} == {"gdpr", "privacy", "terms"}
    assert all(document.body_markdown and "placeholder" not in document.body_markdown.lower() for document in documents)
