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
