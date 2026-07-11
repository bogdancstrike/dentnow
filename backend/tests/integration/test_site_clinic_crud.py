"""End-to-end admin CRUD via the qf app: ETag concurrency, scope denial, audit."""
from __future__ import annotations

import uuid

import pytest

from src.iam import token_verifier
from tests.iam_helpers import base_claims, make_keypair, sign


@pytest.fixture(scope="module")
def client(db_engine):  # db_engine ensures DATABASE_URL is present/reachable
    from wsgi import app

    return app.test_client()


@pytest.fixture()
def keyed():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    yield priv
    token_verifier._jwks.clear()


def _token(priv, roles, sub="user-1"):
    return sign(base_claims(sub=sub, realm_access={"roles": roles}), priv, "k1")


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_clinic_crud_lifecycle_with_etag(client, keyed):
    admin = _token(keyed, ["dentnow_admin"])
    slug = f"c-{uuid.uuid4().hex[:8]}"

    # create
    r = client.post("/api/v1/admin/clinics", json={"slug": slug, "name": "Test"}, headers=_auth(admin))
    assert r.status_code == 201, r.get_data(as_text=True)
    body = r.get_json()
    cid = body["id"]
    assert r.headers.get("ETag") == '"1"'
    assert r.headers.get("Cache-Control") == "no-store"

    # get returns ETag
    r = client.get(f"/api/v1/admin/clinics/{cid}", headers=_auth(admin))
    assert r.status_code == 200
    etag = r.headers.get("ETag")
    assert etag == '"1"'

    # update with correct If-Match
    r = client.patch(
        f"/api/v1/admin/clinics/{cid}", json={"name": "Renamed"},
        headers={**_auth(admin), "If-Match": etag},
    )
    assert r.status_code == 200
    assert r.get_json()["version"] == 2

    # stale If-Match -> 409
    r = client.patch(
        f"/api/v1/admin/clinics/{cid}", json={"name": "Nope"},
        headers={**_auth(admin), "If-Match": '"1"'},
    )
    assert r.status_code == 409

    # missing If-Match -> 400 (optimistic concurrency required)
    r = client.patch(f"/api/v1/admin/clinics/{cid}", json={"name": "x"}, headers=_auth(admin))
    assert r.status_code == 400

    # delete with current If-Match
    r = client.delete(f"/api/v1/admin/clinics/{cid}", headers={**_auth(admin), "If-Match": '"2"'})
    assert r.status_code == 200
    r = client.get(f"/api/v1/admin/clinics/{cid}", headers=_auth(admin))
    assert r.status_code == 404


def test_public_and_unauthenticated_boundaries(client, keyed):
    # anonymous public health is fine
    assert client.get("/api/health").status_code == 200
    # admin without token -> 401
    assert client.get("/api/v1/admin/clinics").status_code == 401
    # valid token, no DentNow role -> 403
    norole = _token(keyed, ["offline_access"])
    assert client.get("/api/v1/admin/clinics", headers=_auth(norole)).status_code == 403


def test_editor_cannot_manage_clinic_scopes(client, keyed):
    editor = _token(keyed, ["dentnow_editor"])
    r = client.get("/api/v1/admin/admin-principals", headers=_auth(editor))
    assert r.status_code == 403  # requires clinic_scopes:manage (admin only)


def test_clinic_manager_denied_other_clinic(client, keyed):
    admin = _token(keyed, ["dentnow_admin"])
    a = client.post("/api/v1/admin/clinics", json={"slug": f"a-{uuid.uuid4().hex[:8]}", "name": "A"}, headers=_auth(admin)).get_json()
    b = client.post("/api/v1/admin/clinics", json={"slug": f"b-{uuid.uuid4().hex[:8]}", "name": "B"}, headers=_auth(admin)).get_json()

    mgr_sub = f"mgr-{uuid.uuid4().hex[:8]}"
    # admin assigns the manager to clinic A only (commits, so the scope provider sees it)
    r = client.post(
        f"/api/v1/admin/admin-principals/{mgr_sub}/clinics",
        json={"clinic_id": a["id"]}, headers=_auth(admin),
    )
    assert r.status_code == 200

    mgr = _token(keyed, ["dentnow_clinic_manager"], sub=mgr_sub)
    # can read assigned clinic
    assert client.get(f"/api/v1/admin/clinics/{a['id']}", headers=_auth(mgr)).status_code == 200
    # cannot read another clinic (404, never revealed)
    assert client.get(f"/api/v1/admin/clinics/{b['id']}", headers=_auth(mgr)).status_code == 404


def test_create_writes_audit_and_outbox(client, keyed, db_session):
    from sqlalchemy import select

    from src.audit.models import AuditEvent
    from src.integrations.models import IntegrationOutbox

    admin = _token(keyed, ["dentnow_admin"])
    slug = f"aud-{uuid.uuid4().hex[:8]}"
    body = client.post("/api/v1/admin/clinics", json={"slug": slug, "name": "Aud"}, headers=_auth(admin)).get_json()

    # audit + outbox rows were committed by the request (separate connection sees them)
    audit = db_session.scalar(
        select(AuditEvent).where(AuditEvent.entity_type == "clinic", AuditEvent.entity_id == body["id"])
    )
    assert audit is not None and audit.action == "clinic.create"
    event = db_session.scalar(
        select(IntegrationOutbox).where(IntegrationOutbox.aggregate_id == body["id"])
    )
    assert event is not None and event.event_type == "clinic.created.v1"
