"""Admin media handlers: upload, metadata, delete, consent attestation/revocation.

Browser uploads go only to this authenticated API — never directly to MinIO, and no
consent-evidence document or patient identifier is accepted.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from flask import request as flask_request
from sqlalchemy import select

from src.api._helpers import _json
from src.core.db import session_scope
from src.core.errors import ValidationError
from src.core.pagination import parse_page
from src.iam.capabilities import (
    CAP_ATTESTATION_APPROVE,
    CAP_CONTENT_READ,
    CAP_CONTENT_WRITE,
)
from src.iam.decorators import require_capability
from src.media.models import MediaAsset
from src.media.serializers import serialize_asset
from src.media.service import MediaService, _variants


@require_capability(CAP_CONTENT_READ)
def media_list(app, operation, request, principal=None, **kw):
    args = flask_request.args
    with session_scope() as session:
        req = parse_page(args, allowed_sort=("created_at", "readiness"), default_sort="created_at")
        q = select(MediaAsset).where(MediaAsset.deleted_at.is_(None))
        if args.get("privacy_class"):
            q = q.where(MediaAsset.privacy_class == args["privacy_class"])
        q = q.order_by(MediaAsset.created_at.desc()).limit(req.page_size).offset(req.offset)
        items = [serialize_asset(a, _variants(session, a.id)) for a in session.scalars(q).all()]
        return _json({"items": items, "page": req.page, "page_size": req.page_size}, 200)


@require_capability(CAP_CONTENT_READ)
def media_get(app, operation, request, principal=None, asset_id=None, **kw):
    with session_scope() as session:
        return _json(MediaService(session, principal).get(asset_id), 200)


@require_capability(CAP_CONTENT_WRITE)
def media_upload(app, operation, request, principal=None, **kw):
    file = flask_request.files.get("file")
    if file is None:
        raise ValidationError("no file part named 'file'")
    data = file.read()
    form = flask_request.form
    with session_scope() as session:
        result = MediaService(session, principal).upload_image(
            data,
            filename=file.filename,
            alt_text=form.get("alt_text"),
            privacy_class=form.get("privacy_class", "public"),
            rights_note=form.get("rights_note"),
        )
        return _json(result, 201)


@require_capability(CAP_CONTENT_WRITE)
def media_update(app, operation, request, principal=None, asset_id=None, **kw):
    body = flask_request.get_json(silent=True) or {}
    allowed = {k: body[k] for k in ("alt_text", "caption", "rights_note", "focal_x", "focal_y") if k in body}
    with session_scope() as session:
        return _json(MediaService(session, principal).update_metadata(asset_id, allowed), 200)


@require_capability(CAP_CONTENT_WRITE)
def media_delete(app, operation, request, principal=None, asset_id=None, **kw):
    with session_scope() as session:
        MediaService(session, principal).delete(asset_id)
        return _json({"status": "deleted"}, 200)


# ── consent attestation / revocation (publisher/admin) ───────────────────────
@require_capability(CAP_ATTESTATION_APPROVE)
def media_consent_attest(app, operation, request, principal=None, asset_id=None, **kw):
    body = flask_request.get_json(silent=True) or {}
    expires_at = None
    if body.get("expires_at"):
        expires_at = datetime.fromisoformat(body["expires_at"]).replace(tzinfo=timezone.utc)
    with session_scope() as session:
        return _json(
            MediaService(session, principal).attest_consent(
                asset_id, scope=body.get("scope"),
                evidence_reference=body.get("evidence_reference"), expires_at=expires_at,
            ),
            200,
        )


@require_capability(CAP_ATTESTATION_APPROVE)
def media_consent_revoke(app, operation, request, principal=None, asset_id=None, **kw):
    body = flask_request.get_json(silent=True) or {}
    with session_scope() as session:
        MediaService(session, principal).revoke_consent(asset_id, reason=body.get("reason"))
        return _json({"status": "revoked"}, 200)
