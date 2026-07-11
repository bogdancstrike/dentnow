"""Validate/publish/rollback semantics (DB-backed, rolled back)."""
from __future__ import annotations

import pytest

from src.clinics.service import ClinicService
from src.core.errors import PermissionDeniedError, ValidationError
from src.editorial.models import LegalDocument
from src.iam.capabilities import ROLE_ADMIN, ROLE_EDITOR
from src.iam.principal import Principal
from src.site.models import SiteState
from src.site.publication_service import activate, publish, validate_only

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))
EDITOR = Principal(subject="ed", roles=frozenset({ROLE_EDITOR}))


def _make_publishable(session):
    for t in ("gdpr", "privacy", "terms"):
        session.add(LegalDocument(doc_type=t, version_label="v1", active=True, body_markdown="text"))
    session.flush()


def _no_active_legal(session):
    """Deactivate any committed legal docs so 'missing legal' is deterministic."""
    from sqlalchemy import update

    session.execute(update(LegalDocument).values(active=False))
    session.flush()


def test_validate_reports_missing_legal(db_session):
    _no_active_legal(db_session)
    result = validate_only(db_session)
    assert result["valid"] is False
    assert any(e["code"] == "missing_legal" for e in result["errors"])


def test_publish_requires_capability(db_session):
    _make_publishable(db_session)
    with pytest.raises(PermissionDeniedError):
        publish(db_session, EDITOR)


def test_publish_blocks_on_errors(db_session):
    _no_active_legal(db_session)
    with pytest.raises(ValidationError):
        publish(db_session, ADMIN)  # no active legal docs -> blocking errors


def test_publish_sets_active_and_noop_on_unchanged(db_session):
    _make_publishable(db_session)
    r1 = publish(db_session, ADMIN)
    assert r1["changed"] is True
    state = db_session.get(SiteState, 1)
    assert str(state.active_publication_id) == r1["publication_id"]
    # unchanged workspace -> no new publication
    r2 = publish(db_session, ADMIN)
    assert r2["changed"] is False
    assert r2["publication_id"] == r1["publication_id"]


def test_rollback_switches_active_pointer(db_session):
    _make_publishable(db_session)
    r1 = publish(db_session, ADMIN)
    # mutate workspace, publish v2
    ClinicService(db_session, ADMIN).create({"slug": "newclinic", "name": "New"})
    r2 = publish(db_session, ADMIN)
    assert r2["version"] == r1["version"] + 1
    assert r2["publication_id"] != r1["publication_id"]
    # editing the workspace did not change the (now v2) active until this publish
    # rollback to v1
    act = activate(db_session, ADMIN, r1["publication_id"])
    assert act["changed"] is True
    state = db_session.get(SiteState, 1)
    assert str(state.active_publication_id) == r1["publication_id"]
    # re-activating the same id is a no-op
    assert activate(db_session, ADMIN, r1["publication_id"])["changed"] is False
