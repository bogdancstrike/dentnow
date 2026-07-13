"""Contract for the audited legacy-content bundle consumed by the canonical seed.

These checks are deliberately database-free: an export that drops page-local content
must fail before an operator reaches the slower clean-volume seed rehearsal.
"""
from __future__ import annotations

import json
from pathlib import Path


SEED_FILE = Path(__file__).resolve().parents[2] / "seeds" / "current-site.json"
DETAIL_PATHS = {
    "/implant-dentar-bucuresti",
    "/aparat-dentar-dristor",
    "/albire-dentara-laser",
    "/protetica-zirconiu",
}


def _fixture() -> dict:
    return json.loads(SEED_FILE.read_text(encoding="utf-8"))


def test_fixture_keeps_complete_clinic_location_content() -> None:
    clinics = _fixture()["clinics"]

    assert len(clinics) == 3
    for clinic in clinics:
        assert clinic["source_path"] == "src/pages/LocationPage.jsx"
        assert clinic["seo"]["title"].strip()
        assert clinic["seo"]["description"].strip()
        assert clinic["subtitle"].strip()
        assert clinic["transit"], f"{clinic['name']} has no transit directions"
        assert clinic["faqs"], f"{clinic['name']} has no FAQs"


def test_fixture_keeps_all_treatment_detail_pages() -> None:
    details = _fixture()["treatmentDetails"]

    assert set(details) == DETAIL_PATHS
    for path, detail in details.items():
        assert detail["source_path"] == "src/pages/TreatmentDetail.jsx"
        assert detail["slug"] == path.removeprefix("/")
        assert detail["seo"]["title"].strip()
        assert detail["seo"]["description"].strip()
        assert detail["hero"]["title"].strip()
        assert detail["overview"].strip()
        assert detail["benefits"]
        assert detail["detail_markdown"].strip()
        assert detail["faqs"]


def test_fixture_keeps_page_local_home_cas_emergency_and_footer_copy() -> None:
    fixture = _fixture()
    page_content = fixture["pageContent"]

    assert {"/", "/decontat-cas", "/urgente-dentare-bucuresti"} <= set(page_content)
    for path, page in page_content.items():
        assert page["source_path"].startswith("src/")
        assert page["sections"], f"{path} has no authored sections"
    for path in ("/", "/decontat-cas", "/urgente-dentare-bucuresti"):
        assert page_content[path]["seo"]["title"].strip()
        assert page_content[path]["seo"]["description"].strip()

    assert len(fixture["gallery"]) == 6
    assert len(fixture["patientJourney"]) == 4
    assert len(fixture["trustStats"]) == 3
    assert fixture["footer"]["description"].strip()


def test_fixture_has_no_placeholder_legal_document() -> None:
    legal = _fixture()["legal"]

    assert set(legal) == {"gdpr", "privacy", "terms"}
    assert all(sections for sections in legal.values())
    assert "placeholder" not in json.dumps(legal, ensure_ascii=False).lower()
