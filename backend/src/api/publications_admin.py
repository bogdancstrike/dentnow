"""Admin publication commands: validate, publish, activate (rollback), restore, list, previews."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import _json
from src.core.db import session_scope
from src.iam.capabilities import (
    CAP_CONTENT_READ,
    CAP_PREVIEW,
    CAP_PUBLICATION_VALIDATE,
    CAP_PUBLISH,
    CAP_RESTORE_WORKSPACE,
)
from src.iam.decorators import require_capability
from src.site import preview_service, publication_service


@require_capability(CAP_PUBLICATION_VALIDATE)
def publications_validate(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        return _json(publication_service.validate_only(session), 200)


@require_capability(CAP_PUBLISH)
def publications_create(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        return _json(publication_service.publish(session, principal), 201)


@require_capability(CAP_PUBLISH)
def publications_activate(app, operation, request, principal=None, publication_id=None, **kw):
    with session_scope() as session:
        return _json(publication_service.activate(session, principal, publication_id), 200)


@require_capability(CAP_RESTORE_WORKSPACE)
def publications_restore(app, operation, request, principal=None, publication_id=None, **kw):
    with session_scope() as session:
        return _json(publication_service.restore_workspace(session, principal, publication_id), 200)


@require_capability(CAP_CONTENT_READ)
def publications_list(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        return _json({"items": publication_service.list_publications(session)}, 200)


@require_capability(CAP_PREVIEW)
def previews_create(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        return _json(preview_service.create_preview(session, principal), 201)
