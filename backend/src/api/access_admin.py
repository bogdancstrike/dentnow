"""Admin-only handlers for principals and clinic-scope assignments.

No endpoint here creates passwords or Keycloak users — it only maps existing
Keycloak subjects (seen via the admin API) to clinic scopes.
"""
from __future__ import annotations

import uuid

from flask import request as flask_request
from sqlalchemy import select

from src.api._helpers import _json
from src.audit.service import write_audit
from src.clinics.models import AdminPrincipalClinic, Clinic
from src.core.correlation import get_correlation_id
from src.core.db import session_scope
from src.core.errors import NotFoundError, ValidationError
from src.iam.capabilities import CAP_MANAGE_CLINIC_SCOPES
from src.iam.decorators import require_capability
from src.iam.models import AdminPrincipal


@require_capability(CAP_MANAGE_CLINIC_SCOPES)
def principals_list(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        rows = session.scalars(
            select(AdminPrincipal).order_by(AdminPrincipal.last_seen_at.desc()).limit(200)
        ).all()
        items = [
            {
                "subject": p.subject,
                "username": p.username,
                "email": p.email,
                "last_seen_at": p.last_seen_at.isoformat() if p.last_seen_at else None,
                "clinic_scopes": [
                    str(c) for c in session.scalars(
                        select(AdminPrincipalClinic.clinic_id).where(
                            AdminPrincipalClinic.subject == p.subject
                        )
                    ).all()
                ],
            }
            for p in rows
        ]
        return _json({"items": items}, 200)


@require_capability(CAP_MANAGE_CLINIC_SCOPES)
def principal_scopes_assign(app, operation, request, principal=None, subject=None, **kw):
    body = flask_request.get_json(silent=True) or {}
    clinic_id = body.get("clinic_id")
    if not clinic_id:
        raise ValidationError("clinic_id is required")
    cid = get_correlation_id()
    with session_scope() as session:
        c_uuid = uuid.UUID(str(clinic_id))
        if session.get(Clinic, c_uuid) is None:
            raise NotFoundError("clinic not found")
        exists = session.get(AdminPrincipalClinic, {"subject": subject, "clinic_id": c_uuid})
        if exists is None:
            session.add(AdminPrincipalClinic(subject=subject, clinic_id=c_uuid))
            session.flush()
            write_audit(
                session, action="clinic_scope.assign", entity_type="admin_principal_clinic",
                entity_id=f"{subject}:{clinic_id}", principal=principal,
                after={"subject": subject, "clinic_id": str(clinic_id)}, correlation_id=cid,
            )
        return _json({"subject": subject, "clinic_id": str(clinic_id)}, 200)


@require_capability(CAP_MANAGE_CLINIC_SCOPES)
def principal_scopes_remove(app, operation, request, principal=None, subject=None, clinic_id=None, **kw):
    cid = get_correlation_id()
    with session_scope() as session:
        c_uuid = uuid.UUID(str(clinic_id))
        row = session.get(AdminPrincipalClinic, {"subject": subject, "clinic_id": c_uuid})
        if row is not None:
            session.delete(row)
            session.flush()
            write_audit(
                session, action="clinic_scope.remove", entity_type="admin_principal_clinic",
                entity_id=f"{subject}:{clinic_id}", principal=principal,
                before={"subject": subject, "clinic_id": str(clinic_id)}, correlation_id=cid,
            )
        return _json({"status": "removed"}, 200)
