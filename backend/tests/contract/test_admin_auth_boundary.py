"""Default-deny route-map contract + /api/v1/admin/me 401/403/200 behavior."""
from __future__ import annotations

import importlib
import json
from pathlib import Path

import pytest

from src.iam import token_verifier
from tests.iam_helpers import base_claims, make_keypair, sign

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENDPOINT_MAP = json.loads((BACKEND_DIR / "maps" / "endpoint.json").read_text())


def _admin_endpoints():
    return [e for e in ENDPOINT_MAP["endpoints"] if e["api_url"].startswith("/v1/admin/")]


def test_every_admin_endpoint_is_protected():
    admin = _admin_endpoints()
    assert admin, "expected at least one /v1/admin/* endpoint"
    for ep in admin:
        target = ep["exec_method"]
        module = importlib.import_module(target["module_name"])
        handler = getattr(module, target["method_name"])
        assert getattr(handler, "__dentnow_protected__", False), (
            f"{target['module_name']}.{target['method_name']} is not auth-protected "
            f"(default-deny violation)"
        )


@pytest.fixture(scope="module")
def client():
    from wsgi import app

    return app.test_client()


@pytest.fixture()
def signing_key():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    yield priv
    token_verifier._jwks.clear()


def test_me_requires_token(client):
    resp = client.get("/api/v1/admin/me")
    assert resp.status_code == 401


def test_me_forbids_principal_without_dentnow_role(client, signing_key):
    claims = base_claims(realm_access={"roles": ["offline_access"]})
    token = sign(claims, signing_key, "k1")
    resp = client.get("/api/v1/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_me_allows_editor(client, signing_key):
    token = sign(base_claims(realm_access={"roles": ["dentnow_editor"]}), signing_key, "k1")
    resp = client.get("/api/v1/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["roles"] == ["dentnow_editor"]
    assert "content:read" in body["capabilities"]
    assert body["is_admin"] is False


def test_me_reports_admin_capabilities(client, signing_key):
    token = sign(base_claims(realm_access={"roles": ["dentnow_admin"]}), signing_key, "k1")
    resp = client.get("/api/v1/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["is_admin"] is True
    assert "publish" in body["capabilities"]
    assert "clinic_scopes:manage" in body["capabilities"]
