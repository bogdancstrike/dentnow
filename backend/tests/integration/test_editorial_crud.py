"""Editorial + legal + audit HTTP flow: XSS-safe render, approval gating, audit reads."""
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
def keyed():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    yield priv
    token_verifier._jwks.clear()


def _tok(priv, roles, sub="u1"):
    return {"Authorization": f"Bearer {sign(base_claims(sub=sub, realm_access={'roles': roles}), priv, 'k1')}"}


def test_article_body_html_is_sanitized(client, keyed):
    admin = _tok(keyed, ["dentnow_admin"])
    slug = f"a-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/admin/articles",
        json={"slug": slug, "title": "T", "body_markdown": "Hi <script>alert(1)</script> **bold**"},
        headers=admin,
    )
    assert r.status_code == 201, r.get_data(as_text=True)
    body = r.get_json()
    assert "<script" not in body["body_html"]
    assert "<strong>bold</strong>" in body["body_html"]


def test_legal_approval_requires_publisher(client, keyed):
    admin = _tok(keyed, ["dentnow_admin"])
    editor = _tok(keyed, ["dentnow_editor"], sub="ed")
    r = client.post(
        "/api/v1/admin/legal-documents",
        json={"doc_type": "gdpr", "version_label": "v1", "body_markdown": "text"},
        headers=admin,
    )
    assert r.status_code == 201
    lid = r.get_json()["id"]

    # editor may create but NOT approve (needs attestation capability)
    assert client.post(f"/api/v1/admin/legal-documents/{lid}/approve", json={}, headers=editor).status_code == 403
    # admin approves
    r = client.post(f"/api/v1/admin/legal-documents/{lid}/approve", json={}, headers=admin)
    assert r.status_code == 200
    assert r.get_json()["active"] is True
    assert r.get_json()["approved_by"] is not None


def test_audit_read_is_publisher_only(client, keyed):
    admin = _tok(keyed, ["dentnow_admin"])
    editor = _tok(keyed, ["dentnow_editor"], sub="ed2")
    publisher = _tok(keyed, ["dentnow_publisher"], sub="pub")

    # generate an audit row
    client.post("/api/v1/admin/articles", json={"slug": f"x-{uuid.uuid4().hex[:8]}", "title": "X"}, headers=admin)

    assert client.get("/api/v1/admin/audit-events", headers=editor).status_code == 403
    r = client.get("/api/v1/admin/audit-events?entity_type=article", headers=publisher)
    assert r.status_code == 200
    data = r.get_json()
    assert "items" in data and data["total"] >= 1
