"""Capability matrix, admin implication, role separation, and clinic-scope denial."""
from __future__ import annotations

import uuid

from src.iam import capabilities as caps
from src.iam.capabilities import capabilities_for
from src.iam.principal import Principal
from src.iam.service import principal_from_claims


def _p(*roles: str, scopes: frozenset[uuid.UUID] = frozenset()) -> Principal:
    return Principal(subject="s", roles=frozenset(roles), clinic_scopes=scopes)


def test_editor_capabilities_exact():
    assert capabilities_for(frozenset({caps.ROLE_EDITOR})) == frozenset({
        caps.CAP_CONTENT_READ, caps.CAP_CONTENT_WRITE, caps.CAP_PREVIEW,
        caps.CAP_PUBLICATION_VALIDATE,
    })


def test_publisher_has_publish_and_audit_editor_does_not():
    editor = _p(caps.ROLE_EDITOR)
    publisher = _p(caps.ROLE_PUBLISHER)
    assert not editor.has_capability(caps.CAP_PUBLISH)
    assert not editor.has_capability(caps.CAP_AUDIT_READ)
    assert publisher.has_capability(caps.CAP_PUBLISH)
    assert publisher.has_capability(caps.CAP_AUDIT_READ)
    # Neither may restore workspace or manage clinic scopes (admin-only).
    assert not publisher.has_capability(caps.CAP_RESTORE_WORKSPACE)
    assert not publisher.has_capability(caps.CAP_MANAGE_CLINIC_SCOPES)


def test_admin_implies_all_capabilities():
    admin = _p(caps.ROLE_ADMIN)
    assert admin.capabilities == caps.ALL_CAPABILITIES
    assert admin.is_admin
    assert admin.has_capability(caps.CAP_RESTORE_WORKSPACE)
    assert admin.has_capability(caps.CAP_MANAGE_CLINIC_SCOPES)


def test_clinic_manager_capabilities_and_scope():
    c1, c2 = uuid.uuid4(), uuid.uuid4()
    mgr = _p(caps.ROLE_CLINIC_MANAGER, scopes=frozenset({c1}))
    assert mgr.is_clinic_scoped
    assert mgr.has_capability(caps.CAP_CONTENT_WRITE)
    assert not mgr.has_capability(caps.CAP_PUBLISH)
    assert mgr.can_access_clinic(c1)
    assert not mgr.can_access_clinic(c2)
    assert not mgr.can_access_clinic(None)


def test_admin_bypasses_clinic_scope():
    admin = _p(caps.ROLE_ADMIN)
    assert not admin.is_clinic_scoped
    assert admin.can_access_clinic(uuid.uuid4())
    assert admin.can_access_clinic(None)


def test_no_role_has_no_capabilities():
    nobody = Principal(subject="s", roles=frozenset())
    assert nobody.capabilities == frozenset()
    assert not nobody.has_any_dentnow_role()


def test_principal_from_claims_filters_unknown_roles():
    claims = {
        "sub": "u1",
        "preferred_username": "bob",
        "realm_access": {"roles": ["dentnow_publisher", "offline_access", "uma_authorization"]},
    }
    p = principal_from_claims(claims)
    assert p.dentnow_roles == frozenset({"dentnow_publisher"})
    assert p.username == "bob"
