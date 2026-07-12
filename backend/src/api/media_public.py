"""Public media proxy: bytes served only for assets referenced by the active
publication (wired in Task 11). Consent-bound media checks the mutable delivery
block/attestation on every request and returns 410 after revocation/expiry.
"""
from __future__ import annotations

from src.api._helpers import public_endpoint

from flask import Response

from src.core.db import session_scope
from src.media.service import MediaService


def _principal_none():
    from src.iam.principal import Principal

    return Principal(subject="public", roles=frozenset())


@public_endpoint
def media_public(app, operation, request, asset_id=None, variant="card", **kw):
    # The snapshot/publication system was removed — admin changes (including new media)
    # are live immediately, so the public proxy serves any ready public asset rather
    # than requiring a PublicationMedia reference that is no longer created. Consent-
    # bound assets (case images) remain gated by _assert_deliverable inside read_variant.
    with session_scope() as session:
        data, content_type, etag, cache = MediaService(session, _principal_none()).read_variant(
            asset_id, variant, require_publication=False
        )
    resp = Response(data, mimetype=content_type)
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = cache
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp
