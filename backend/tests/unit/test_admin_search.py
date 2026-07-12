"""Permission-scoped admin search."""
from __future__ import annotations

import uuid

from src.clinics.service import ClinicService
from src.iam.capabilities import ROLE_ADMIN, ROLE_CLINIC_MANAGER
from src.iam.principal import Principal
from src.site.search_service import search

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def test_min_length_returns_empty(db_session):
    assert search(db_session, ADMIN, "a")["results"] == []
    assert search(db_session, ADMIN, "")["results"] == []


def test_no_capability_returns_empty(db_session):
    nobody = Principal(subject="x", roles=frozenset())
    assert search(db_session, nobody, "dent")["results"] == []


def test_finds_clinic_by_name(db_session):
    ClinicService(db_session, ADMIN).create({"slug": "dristor-x", "name": "DentNow SearchTest"})
    hits = search(db_session, ADMIN, "SearchTest")["results"]
    assert any(h["type"] == "clinic" and "SearchTest" in h["title"] for h in hits)
    assert all(set(h.keys()) == {"type", "id", "title", "route"} for h in hits)


def test_clinic_manager_scope_limits_results(db_session):
    a, _ = ClinicService(db_session, ADMIN).create({"slug": "scoped-a", "name": "ScopedAlpha"})
    ClinicService(db_session, ADMIN).create({"slug": "scoped-b", "name": "ScopedBravo"})
    mgr = Principal(
        subject="mgr", roles=frozenset({ROLE_CLINIC_MANAGER}),
        clinic_scopes=frozenset({uuid.UUID(a["id"])}),
    )
    hits = [h for h in search(db_session, mgr, "Scoped")["results"] if h["type"] == "clinic"]
    titles = {h["title"] for h in hits}
    assert "ScopedAlpha" in titles
    assert "ScopedBravo" not in titles
