"""GET /api/v1/admin/search — permission-scoped command-palette search."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import _json
from src.core.db import session_scope
from src.iam.capabilities import CAP_CONTENT_READ
from src.iam.decorators import require_capability
from src.site import search_service


@require_capability(CAP_CONTENT_READ)
def admin_search(app, operation, request, principal=None, **kw):
    q = flask_request.args.get("q")
    limit = flask_request.args.get("limit")
    with session_scope() as session:
        return _json(search_service.search(session, principal, q, limit), 200)
