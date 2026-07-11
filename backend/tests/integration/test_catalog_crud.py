"""Catalog HTTP CRUD via the qf app."""
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
def admin_headers():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    token = sign(base_claims(sub="admin", realm_access={"roles": ["dentnow_admin"]}), priv, "k1")
    yield {"Authorization": f"Bearer {token}"}
    token_verifier._jwks.clear()


def test_treatment_and_price_flow(client, admin_headers):
    slug = f"t-{uuid.uuid4().hex[:8]}"
    r = client.post("/api/v1/admin/treatments", json={"slug": slug, "name": "Implant"}, headers=admin_headers)
    assert r.status_code == 201, r.get_data(as_text=True)
    tid = r.get_json()["id"]

    # valid price
    r = client.post(
        "/api/v1/admin/treatment-prices",
        json={"treatment_id": tid, "price_kind": "from", "amount": 1490, "currency": "RON"},
        headers=admin_headers,
    )
    assert r.status_code == 201
    assert r.get_json()["amount"] == 1490.0

    # invalid price rejected by validation (400), not a 500
    r = client.post(
        "/api/v1/admin/treatment-prices",
        json={"treatment_id": tid, "price_kind": "range", "amount": 500, "amount_max": 100, "currency": "RON"},
        headers=admin_headers,
    )
    assert r.status_code == 400


def test_offer_crud_and_date_validation(client, admin_headers):
    slug = f"o-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/admin/offers",
        json={"slug": slug, "name": "Promo", "status": "active", "starts_at": "2026-01-01", "ends_at": "2026-03-01"},
        headers=admin_headers,
    )
    assert r.status_code == 201
    oid = r.get_json()["id"]
    etag = r.headers.get("ETag")

    # bad date window -> 400
    r = client.post(
        "/api/v1/admin/offers",
        json={"slug": f"bad-{uuid.uuid4().hex[:6]}", "name": "Bad", "starts_at": "2026-03-01", "ends_at": "2026-01-01"},
        headers=admin_headers,
    )
    assert r.status_code == 400

    # update with ETag
    r = client.patch(f"/api/v1/admin/offers/{oid}", json={"featured": True}, headers={**admin_headers, "If-Match": etag})
    assert r.status_code == 200
    assert r.get_json()["featured"] is True
