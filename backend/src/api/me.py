"""GET /api/v1/admin/me — principal, effective roles, capabilities, clinic scopes."""
from __future__ import annotations

from src.iam.decorators import require_authenticated
from src.iam.principal import Principal


@require_authenticated
def me(app, operation, request, principal: Principal | None = None, **kwargs):
    assert principal is not None  # guaranteed by require_authenticated
    return {
        "subject": principal.subject,
        "username": principal.username,
        "email": principal.email,
        "roles": sorted(principal.dentnow_roles),
        "capabilities": sorted(principal.capabilities),
        "clinic_scopes": sorted(str(cid) for cid in principal.clinic_scopes),
        "is_admin": principal.is_admin,
        "is_clinic_scoped": principal.is_clinic_scoped,
    }, 200
