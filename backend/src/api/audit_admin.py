"""Read-only, redacted audit endpoints (publisher/admin via CAP_AUDIT_READ)."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import _json
from src.audit.repository import get_audit, query_audit
from src.core.db import session_scope
from src.core.errors import NotFoundError
from src.core.pagination import parse_page
from src.iam.capabilities import CAP_AUDIT_READ
from src.iam.decorators import require_capability


@require_capability(CAP_AUDIT_READ)
def audit_list(app, operation, request, principal=None, **kw):
    args = flask_request.args
    with session_scope() as session:
        req = parse_page(args)
        return _json(
            query_audit(
                session, req,
                action=args.get("action"), entity_type=args.get("entity_type"),
                entity_id=args.get("entity_id"), actor=args.get("actor"),
            ),
            200,
        )


@require_capability(CAP_AUDIT_READ)
def audit_get(app, operation, request, principal=None, event_id=None, **kw):
    with session_scope() as session:
        result = get_audit(session, int(event_id))
        if result is None:
            raise NotFoundError("audit event not found")
        return _json(result, 200)
