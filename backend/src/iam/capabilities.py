"""DentNow realm roles and the capability matrix (architecture §9.3).

Only the four ``dentnow_*`` realm roles are mapped. ``dentnow_admin`` implies every
capability. Clinic-manager capabilities are clinic-scoped — the capability check
passes, and the owning service restricts the rows to the principal's assigned clinics.
"""
from __future__ import annotations

# ── Realm roles ─────────────────────────────────────────────────────────────
ROLE_ADMIN = "dentnow_admin"
ROLE_EDITOR = "dentnow_editor"
ROLE_PUBLISHER = "dentnow_publisher"
ROLE_CLINIC_MANAGER = "dentnow_clinic_manager"

ALL_ROLES = frozenset({ROLE_ADMIN, ROLE_EDITOR, ROLE_PUBLISHER, ROLE_CLINIC_MANAGER})

# ── Capabilities ────────────────────────────────────────────────────────────
CAP_CONTENT_READ = "content:read"
CAP_CONTENT_WRITE = "content:write"
CAP_PREVIEW = "preview"
CAP_PUBLICATION_VALIDATE = "publication:validate"
CAP_ATTESTATION_APPROVE = "attestation:approve"
CAP_PUBLISH = "publish"
CAP_RESTORE_WORKSPACE = "workspace:restore"
CAP_AUDIT_READ = "audit:read"
CAP_MANAGE_CLINIC_SCOPES = "clinic_scopes:manage"
CAP_ANALYTICS_READ = "analytics:read"

ALL_CAPABILITIES = frozenset({
    CAP_CONTENT_READ, CAP_CONTENT_WRITE, CAP_PREVIEW, CAP_PUBLICATION_VALIDATE,
    CAP_ATTESTATION_APPROVE, CAP_PUBLISH, CAP_RESTORE_WORKSPACE, CAP_AUDIT_READ,
    CAP_MANAGE_CLINIC_SCOPES, CAP_ANALYTICS_READ,
})

# Capabilities a clinic manager exercises only within assigned-clinic scope.
CLINIC_SCOPED_CAPABILITIES = frozenset({CAP_CONTENT_READ, CAP_CONTENT_WRITE, CAP_PREVIEW})

ROLE_CAPABILITIES: dict[str, frozenset[str]] = {
    ROLE_EDITOR: frozenset({
        CAP_CONTENT_READ, CAP_CONTENT_WRITE, CAP_PREVIEW, CAP_PUBLICATION_VALIDATE,
    }),
    ROLE_PUBLISHER: frozenset({
        CAP_CONTENT_READ, CAP_CONTENT_WRITE, CAP_PREVIEW, CAP_PUBLICATION_VALIDATE,
        CAP_ATTESTATION_APPROVE, CAP_PUBLISH, CAP_AUDIT_READ, CAP_ANALYTICS_READ,
    }),
    ROLE_CLINIC_MANAGER: frozenset({
        CAP_CONTENT_READ, CAP_CONTENT_WRITE, CAP_PREVIEW,
    }),
    ROLE_ADMIN: ALL_CAPABILITIES,
}


def capabilities_for(roles: frozenset[str]) -> frozenset[str]:
    if ROLE_ADMIN in roles:
        return ALL_CAPABILITIES
    caps: set[str] = set()
    for role in roles:
        caps |= ROLE_CAPABILITIES.get(role, frozenset())
    return frozenset(caps)
