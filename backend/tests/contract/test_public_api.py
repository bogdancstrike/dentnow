"""Public read API + preview flow over the qf app."""
from __future__ import annotations

import uuid

import pytest

from src.iam import token_verifier
from tests.iam_helpers import base_claims, make_keypair, sign


@pytest.fixture(scope="module")
def client(db_engine):
    from wsgi import app

    return app.test_client()


@pytest.fixture()
def admin():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    token = sign(base_claims(sub="admin", realm_access={"roles": ["dentnow_admin"]}), priv, "k1")
    yield {"Authorization": f"Bearer {token}"}
    token_verifier._jwks.clear()


def _publish(client, admin):
    for t in ("gdpr", "privacy", "terms"):
        r = client.post("/api/v1/admin/legal-documents",
                        json={"doc_type": t, "version_label": uuid.uuid4().hex[:6], "body_markdown": "x"},
                        headers=admin)
        lid = r.get_json()["id"]
        client.post(f"/api/v1/admin/legal-documents/{lid}/approve", json={}, headers=admin)
    return client.post("/api/v1/admin/publications", headers=admin)


def test_publish_then_public_bootstrap_is_anonymous(client, admin):
    r = _publish(client, admin)
    assert r.status_code == 201, r.get_data(as_text=True)

    r = client.get("/api/v1/public/bootstrap")  # no auth
    assert r.status_code == 200
    body = r.get_json()
    assert "release_version" in body and body["site"] is not None
    etag = r.headers.get("ETag")
    assert etag and r.headers.get("X-Release-Version")

    # conditional GET -> 304
    r304 = client.get("/api/v1/public/bootstrap", headers={"If-None-Match": etag})
    assert r304.status_code == 304

    # sitemap is public XML
    r = client.get("/api/v1/public/sitemap.xml")
    assert r.status_code == 200 and "urlset" in r.get_data(as_text=True)


def test_public_endpoints_do_not_require_auth(client):
    # even without a publication these are anonymous (404, never 401)
    assert client.get("/api/v1/public/articles").status_code in (200, 404)


def test_published_news_has_a_public_detail_page(client, admin):
    news_id = None
    slug = f"noutate-{uuid.uuid4().hex[:8]}"
    try:
        created = client.post(
            "/api/v1/admin/news",
            json={
                "slug": slug,
                "category": "Program",
                "title": "Program special",
                "summary": "Program actualizat.",
                "body_markdown": "## Orarul clinicilor\n\nConsultați intervalele actualizate.",
                "published_at": "2026-07-13",
                "status": "published",
                "position": 0,
            },
            headers=admin,
        )
        assert created.status_code == 201, created.get_data(as_text=True)
        news_id = created.get_json()["id"]

        detail = client.get(f"/api/v1/public/news/{slug}")
        assert detail.status_code == 200
        assert detail.get_json()["news_item"]["title"] == "Program special"
        assert "Orarul clinicilor" in detail.get_json()["news_item"]["body_html"]
        assert f"/noutati/{slug}" in client.get("/api/v1/public/sitemap.xml").get_data(as_text=True)
    finally:
        if news_id:
            assert client.delete(
                f"/api/v1/admin/news/{news_id}",
                headers={**admin, "If-Match": '"1"'},
            ).status_code in (200, 204)


def test_public_offer_exposes_admin_selected_treatments_and_clinics(client, admin):
    treatment_id = clinic_id = offer_id = None
    suffix = uuid.uuid4().hex[:8]
    try:
        treatment = client.post(
            "/api/v1/admin/treatments",
            json={"slug": f"tratament-oferta-{suffix}", "name": "Tratament ofertă"},
            headers=admin,
        )
        assert treatment.status_code == 201, treatment.get_data(as_text=True)
        treatment_id = treatment.get_json()["id"]

        clinic = client.post(
            "/api/v1/admin/clinics",
            json={"slug": f"clinica-oferta-{suffix}", "name": "Clinica ofertă"},
            headers=admin,
        )
        assert clinic.status_code == 201, clinic.get_data(as_text=True)
        clinic_id = clinic.get_json()["id"]

        offer = client.post(
            "/api/v1/admin/offers",
            json={
                "slug": f"oferta-relationata-{suffix}",
                "name": "Ofertă relaționată",
                "status": "active",
                "treatment_ids": [treatment_id],
                "clinic_ids": [clinic_id],
            },
            headers=admin,
        )
        assert offer.status_code == 201, offer.get_data(as_text=True)
        offer_id = offer.get_json()["id"]
        assert offer.get_json()["treatment_ids"] == [treatment_id]
        assert offer.get_json()["clinic_ids"] == [clinic_id]

        public_offer = next(
            item for item in client.get("/api/v1/public/offers").get_json()["items"]
            if item["slug"] == f"oferta-relationata-{suffix}"
        )
        assert public_offer["treatments"] == [
            {"slug": f"tratament-oferta-{suffix}", "name": "Tratament ofertă"}
        ]
        assert public_offer["clinics"] == [
            {"slug": f"clinica-oferta-{suffix}", "name": "Clinica ofertă"}
        ]
    finally:
        for endpoint, resource_id in (
            ("offers", offer_id),
            ("treatments", treatment_id),
            ("clinics", clinic_id),
        ):
            if resource_id:
                assert client.delete(
                    f"/api/v1/admin/{endpoint}/{resource_id}",
                    headers={**admin, "If-Match": '"1"'},
                ).status_code in (200, 204)


def test_case_study_is_public_only_after_consent_approval(client, admin):
    case_id = None
    try:
        created = client.post(
            "/api/v1/admin/case-studies",
            json={
                "title": "Caz Before After API",
                "description": "Descriere controlată din admin.",
                "disclaimer": "Rezultatele pot varia.",
                "position": -10,
            },
            headers=admin,
        )
        assert created.status_code == 201, created.get_data(as_text=True)
        case_id = created.get_json()["id"]
        assert all(
            item["id"] != case_id
            for item in client.get("/api/v1/public/case-studies").get_json()["items"]
        )

        approved = client.post(
            f"/api/v1/admin/case-studies/{case_id}/consent",
            json={"consent_state": "approved"},
            headers=admin,
        )
        assert approved.status_code == 200, approved.get_data(as_text=True)
        public_items = client.get("/api/v1/public/case-studies").get_json()["items"]
        assert public_items[0]["id"] == case_id
        assert public_items[0]["title"] == "Caz Before After API"
    finally:
        if case_id:
            assert client.delete(
                f"/api/v1/admin/case-studies/{case_id}",
                headers={**admin, "If-Match": '"2"'},
            ).status_code in (200, 204)


def test_approved_legal_document_drives_public_page(client, admin):
    legal_id = None
    try:
        created = client.post(
            "/api/v1/admin/legal-documents",
            json={
                "doc_type": "privacy",
                "version_label": f"test-{uuid.uuid4().hex[:8]}",
                "effective_date": "2026-07-13",
                "body_markdown": "## Politică administrată\n\nConținut juridic din CRUD.",
            },
            headers=admin,
        )
        assert created.status_code == 201, created.get_data(as_text=True)
        legal_id = created.get_json()["id"]

        approved = client.post(
            f"/api/v1/admin/legal-documents/{legal_id}/approve",
            json={"approved": True},
            headers=admin,
        )
        assert approved.status_code == 200, approved.get_data(as_text=True)
        public_document = client.get("/api/v1/public/legal/privacy")
        assert public_document.status_code == 200
        body = public_document.get_json()["legal_document"]
        assert body["effective_date"] == "2026-07-13"
        assert "Politică administrată" in body["body_html"]
    finally:
        if legal_id:
            assert client.delete(
                f"/api/v1/admin/legal-documents/{legal_id}",
                headers={**admin, "If-Match": '"2"'},
            ).status_code in (200, 204)


def test_public_bootstrap_includes_active_quiz_children(client, admin):
    quiz_id = None
    try:
        quiz = client.post(
            "/api/v1/admin/quizzes",
            json={"slug": f"igiena-{uuid.uuid4().hex[:8]}", "title": "Scor personalizat", "intro": "Intro API"},
            headers=admin,
        )
        assert quiz.status_code == 201
        quiz_id = quiz.get_json()["id"]
        question = client.post(
            "/api/v1/admin/quiz-questions",
            json={"quiz_id": quiz_id, "prompt": "Întrebare API", "position": 0},
            headers=admin,
        )
        assert question.status_code == 201
        question_id = question.get_json()["id"]
        option = client.post(
            "/api/v1/admin/quiz-options",
            json={"question_id": question_id, "label": "Răspuns API", "score": 5, "position": 0},
            headers=admin,
        )
        assert option.status_code == 201

        body = client.get("/api/v1/public/bootstrap").get_json()
        assert body["quiz"]["title"] == "Scor personalizat"
        assert body["quiz"]["questions"][0]["prompt"] == "Întrebare API"
        assert body["quiz"]["questions"][0]["options"][0]["label"] == "Răspuns API"
    finally:
        if quiz_id:
            cleanup_headers = {**admin, "If-Match": '"1"'}
            assert client.delete(
                f"/api/v1/admin/quizzes/{quiz_id}", headers=cleanup_headers
            ).status_code in (200, 204)


def test_public_content_uses_admin_positions_and_exposes_rich_doctor_profile(client, admin):
    doctor_id = None
    try:
        created = client.post(
            "/api/v1/admin/doctors",
            json={
                "slug": f"medic-{uuid.uuid4().hex[:8]}",
                "name": "Dr. Test Ordine",
                "role": "Medic dentist",
                "focus": "Prezentare scurtă",
                "description": "Biografie profesională completă.",
                "approach": "Explic fiecare etapă înainte de tratament.",
                "credentials": "Acreditare test",
                "workspace_media_id": None,
                "secondary_media_id": None,
                "position": -100,
                "active": True,
            },
            headers=admin,
        )
        assert created.status_code == 201, created.get_data(as_text=True)
        doctor_id = created.get_json()["id"]

        bootstrap_body = client.get("/api/v1/public/bootstrap").get_json()
        doctor = next(item for item in bootstrap_body["doctors"] if item["name"] == "Dr. Test Ordine")
        assert doctor["description"] == "Biografie profesională completă."
        assert doctor["approach"] == "Explic fiecare etapă înainte de tratament."
        assert bootstrap_body["doctors"][0]["name"] == "Dr. Test Ordine"
        assert [item["position"] for item in bootstrap_body["clinics"]] == sorted(
            item["position"] for item in bootstrap_body["clinics"]
        )
        assert [item["position"] for item in bootstrap_body["partners"]] == sorted(
            item["position"] for item in bootstrap_body["partners"]
        )

        articles = client.get("/api/v1/public/articles").get_json()["items"]
        assert [item["position"] for item in articles] == sorted(item["position"] for item in articles)
        offers = client.get("/api/v1/public/offers").get_json()["items"]
        assert [item["position"] for item in offers] == sorted(item["position"] for item in offers)
    finally:
        if doctor_id:
            assert client.delete(
                f"/api/v1/admin/doctors/{doctor_id}",
                headers={**admin, "If-Match": '"1"'},
            ).status_code in (200, 204)


def test_preview_one_use_exchange(client, admin):
    r = client.post("/api/v1/admin/previews", headers=admin)
    assert r.status_code == 201
    token = r.get_json()["token"]

    # exchange the one-use token -> sets HttpOnly cookie
    r = client.post("/api/v1/preview/session", json={"token": token})
    assert r.status_code == 200

    # frozen bootstrap works with the cookie the client now holds
    r = client.get("/api/v1/preview/bootstrap")
    assert r.status_code == 200 and r.get_json()["preview"] is True

    # the one-use token is now invalid
    r = client.post("/api/v1/preview/session", json={"token": token})
    assert r.status_code == 401


def test_preview_requires_session(client):
    # fresh client without a cookie is denied
    from wsgi import app

    fresh = app.test_client()
    assert fresh.get("/api/v1/preview/bootstrap").status_code == 401
