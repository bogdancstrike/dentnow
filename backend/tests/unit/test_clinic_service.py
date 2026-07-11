"""Clinic domain service tests (DB-backed, rolled back)."""
from __future__ import annotations

import uuid

import pytest

from src.clinics.service import ClinicService, ContactService, HoursService
from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import parse_page
from src.iam.capabilities import ROLE_ADMIN, ROLE_CLINIC_MANAGER
from src.iam.principal import Principal

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def _mk_clinic(session, principal=ADMIN, **over):
    data = {"slug": over.pop("slug", "dristor"), "name": over.pop("name", "DentNow Dristor")}
    data.update(over)
    body, etag = ClinicService(session, principal).create(data)
    return body, etag


def test_clinic_create_and_versioned_etag(db_session):
    body, etag = _mk_clinic(db_session)
    assert body["version"] == 1
    assert etag == '"1"'
    assert body["slug"] == "dristor"


def test_clinic_update_requires_matching_if_match(db_session):
    body, etag = _mk_clinic(db_session)
    svc = ClinicService(db_session, ADMIN)
    updated, new_etag = svc.update(body["id"], {"name": "Renamed"}, etag)
    assert updated["name"] == "Renamed"
    assert updated["version"] == 2
    # Stale If-Match now conflicts.
    with pytest.raises(ConflictError):
        svc.update(body["id"], {"name": "Again"}, etag)


def test_clinic_unique_slug(db_session):
    _mk_clinic(db_session, slug="dristor")
    with pytest.raises(ConflictError):
        _mk_clinic(db_session, slug="dristor", name="Dup")


def test_clinic_soft_delete_hides_it(db_session):
    body, etag = _mk_clinic(db_session)
    svc = ClinicService(db_session, ADMIN)
    svc.delete(body["id"], etag)
    with pytest.raises(NotFoundError):
        svc.get(body["id"])


def test_contact_phone_is_normalized(db_session):
    clinic, _ = _mk_clinic(db_session)
    body, _etag = ContactService(db_session, ADMIN).create(
        {"clinic_id": clinic["id"], "kind": "phone", "display_value": "0720 509 802"}
    )
    assert body["normalized_value"] == "0720509802"


def test_hours_unique_per_weekday(db_session):
    clinic, _ = _mk_clinic(db_session)
    svc = HoursService(db_session, ADMIN)
    svc.create({"clinic_id": clinic["id"], "weekday": 0, "opens_at": "09:00", "closes_at": "19:00"})
    with pytest.raises(ConflictError):
        svc.create({"clinic_id": clinic["id"], "weekday": 0, "closed": True})


def test_clinic_manager_scope_limits_list_and_get(db_session):
    a, _ = _mk_clinic(db_session, slug="a", name="A")
    b, _ = _mk_clinic(db_session, slug="b", name="B")
    mgr = Principal(
        subject="mgr",
        roles=frozenset({ROLE_CLINIC_MANAGER}),
        clinic_scopes=frozenset({uuid.UUID(a["id"])}),
    )
    svc = ClinicService(db_session, mgr)
    listing = svc.list(parse_page({}, allowed_sort=ClinicService.sortable))
    returned_ids = {item["id"] for item in listing["items"]}
    assert a["id"] in returned_ids
    assert b["id"] not in returned_ids
    # Out-of-scope get is a not-found (never reveal the record).
    with pytest.raises(NotFoundError):
        svc.get(b["id"])
    # In-scope get works.
    assert svc.get(a["id"])[0]["id"] == a["id"]


def test_workspace_version_increments_on_mutation(db_session):
    from src.site.workspace import current_workspace_version

    start = current_workspace_version(db_session)
    _mk_clinic(db_session)
    assert current_workspace_version(db_session) > start
