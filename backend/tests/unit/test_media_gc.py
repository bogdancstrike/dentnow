"""Media GC candidate computation (DB-backed)."""
from __future__ import annotations

import uuid

from src.core.clock import utcnow
from src.media.models import ContentMediaLink, MediaAsset
from scripts.gc_media import compute_candidates


def _asset(session, *, deleted, privacy="public"):
    a = MediaAsset(
        object_key=f"site/{uuid.uuid4()}/original.png", media_kind="image", mime_type="image/png",
        byte_size=10, sha256=uuid.uuid4().hex, privacy_class=privacy, readiness="ready",
        deleted_at=utcnow() if deleted else None,
    )
    session.add(a)
    session.flush()
    return a


def test_only_soft_deleted_unreferenced_are_candidates(db_session):
    live = _asset(db_session, deleted=False)
    orphan = _asset(db_session, deleted=True)
    referenced = _asset(db_session, deleted=True)
    db_session.add(ContentMediaLink(asset_id=referenced.id, entity_type="article", entity_id="x", usage="cover"))
    db_session.flush()

    candidate_ids = {a.id for a in compute_candidates(db_session)}
    assert orphan.id in candidate_ids
    assert live.id not in candidate_ids  # not soft-deleted
    assert referenced.id not in candidate_ids  # still referenced by workspace
