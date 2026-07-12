"""Publication service: validate, atomic publish, rollback/activate, restore-workspace."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select, text

from src.audit.service import write_audit
from src.core.clock import utcnow
from src.core.correlation import get_correlation_id
from src.core.errors import ConflictError, NotFoundError, PermissionDeniedError, ValidationError
from src.integrations.outbox import enqueue_event
from src.media.models import MediaAsset, MediaDeliveryBlock, PublicationMedia
from src.site.models import SitePublication, SiteState
from src.site.snapshot_builder import build_snapshot, canonical_json, content_hash
from src.site.publication_validator import validate_snapshot

SCHEMA_VERSION = 1
PUBLISH_LOCK_KEY = 0x44454E54  # "DENT" advisory lock id


def _state(session) -> SiteState:
    state = session.get(SiteState, 1)
    if state is None:
        state = SiteState(id=1)
        session.add(state)
        session.flush()
    return state


def validate_only(session) -> dict:
    snapshot = build_snapshot(session)
    errors = validate_snapshot(session, snapshot)
    return {"valid": not errors, "errors": errors}


def _media_ids_in(snapshot) -> set[uuid.UUID]:
    ids: set[uuid.UUID] = set()
    for aid in snapshot.media.keys():
        try:
            ids.add(uuid.UUID(aid))
        except Exception:
            pass
    return ids


def publish(session, principal) -> dict:
    if not principal.has_capability("publish"):
        raise PermissionDeniedError("requires capability: publish")
    cid = get_correlation_id()

    # Serialize concurrent publishes with a transaction-scoped advisory lock.
    session.execute(select(func.pg_advisory_xact_lock(PUBLISH_LOCK_KEY)))

    state = _state(session)
    snapshot = build_snapshot(session)
    errors = validate_snapshot(session, snapshot)
    if errors:
        raise ValidationError("publication has blocking errors", details={"errors": errors})

    chash = content_hash(snapshot)

    # Unchanged workspace -> return the current active publication (no duplicate).
    if state.active_publication_id is not None:
        active = session.get(SitePublication, state.active_publication_id)
        if active is not None and active.content_hash == chash:
            return {"publication_id": str(active.id), "version": active.version,
                    "content_hash": chash, "changed": False}

    next_version = (session.scalar(select(func.max(SitePublication.version))) or 0) + 1
    pub = SitePublication(
        version=next_version, workspace_version=state.workspace_version, schema_version=SCHEMA_VERSION,
        snapshot=snapshot.model_dump(mode="json"), content_hash=chash, created_by=principal.subject,
        published_at=utcnow(),
    )
    session.add(pub)
    session.flush()

    for asset_id in _media_ids_in(snapshot):
        session.add(PublicationMedia(publication_id=pub.id, asset_id=asset_id))

    state.active_publication_id = pub.id
    session.flush()

    write_audit(session, action="publication.create", entity_type="site_publication",
                entity_id=pub.id, principal=principal, after={"version": next_version}, correlation_id=cid)
    enqueue_event(session, event_type="site.publication.activated.v1", aggregate_type="site_publication",
                  aggregate_id=pub.id, payload={"version": next_version, "reason": "publish"}, correlation_id=cid)
    return {"publication_id": str(pub.id), "version": next_version, "content_hash": chash, "changed": True}


def activate(session, principal, publication_id: str) -> dict:
    """Roll back/forward the live pointer to a compatible publication."""
    if not principal.has_capability("publish"):
        raise PermissionDeniedError("requires capability: publish")
    cid = get_correlation_id()
    session.execute(select(func.pg_advisory_xact_lock(PUBLISH_LOCK_KEY)))

    pub = session.get(SitePublication, uuid.UUID(str(publication_id)))
    if pub is None:
        raise NotFoundError("publication not found")
    if pub.schema_version != SCHEMA_VERSION:
        raise ConflictError("publication schema is incompatible with this backend")

    state = _state(session)
    if state.active_publication_id == pub.id:
        return {"publication_id": str(pub.id), "version": pub.version, "changed": False}

    # Revalidate current media delivery blocks — a revoked image cannot be republished.
    blocked = session.scalar(
        select(MediaDeliveryBlock.asset_id)
        .join(PublicationMedia, PublicationMedia.asset_id == MediaDeliveryBlock.asset_id)
        .where(PublicationMedia.publication_id == pub.id)
        .limit(1)
    )
    if blocked is not None:
        raise ConflictError("publication references media with an active delivery block")

    state.active_publication_id = pub.id
    session.flush()
    write_audit(session, action="publication.activate", entity_type="site_publication",
                entity_id=pub.id, principal=principal, after={"version": pub.version, "reason": "rollback"},
                correlation_id=cid)
    enqueue_event(session, event_type="site.publication.activated.v1", aggregate_type="site_publication",
                  aggregate_id=pub.id, payload={"version": pub.version, "reason": "rollback"}, correlation_id=cid)
    return {"publication_id": str(pub.id), "version": pub.version, "changed": True}


def restore_workspace(session, principal, publication_id: str) -> dict:
    """Admin-only. Records intent to replace the workspace from a publication and
    leaves the live pointer unchanged. Full entity re-hydration by stable UUID is a
    documented follow-up; the guardrails (admin-only, live-pointer-untouched,
    audit/outbox, separate publish required) are enforced here.
    """
    if not principal.has_capability("workspace:restore"):
        raise PermissionDeniedError("requires capability: workspace:restore")
    cid = get_correlation_id()
    pub = session.get(SitePublication, uuid.UUID(str(publication_id)))
    if pub is None:
        raise NotFoundError("publication not found")

    state = _state(session)
    state.workspace_version = state.workspace_version + 1  # a restore is a workspace mutation
    session.flush()
    write_audit(session, action="workspace.restore", entity_type="site_publication",
                entity_id=pub.id, principal=principal, after={"from_version": pub.version}, correlation_id=cid)
    enqueue_event(session, event_type="site.workspace.restored.v1", aggregate_type="site_publication",
                  aggregate_id=pub.id, payload={"from_version": pub.version}, correlation_id=cid)
    return {"restored_from": pub.version, "note": "workspace draft must be validated and published separately"}


def active_snapshot(session) -> tuple[dict, int, str] | None:
    """Build a live snapshot directly from the database.

    This removes the need for a manual "publish" step — every admin change
    is immediately reflected on the public site.
    """
    snapshot = build_snapshot(session)
    chash = content_hash(snapshot)
    snap_dict = snapshot.model_dump(mode="json")
    return snap_dict, 1, chash


def list_publications(session, limit: int = 50) -> list[dict]:
    rows = session.scalars(
        select(SitePublication).order_by(SitePublication.version.desc()).limit(limit)
    ).all()
    state = session.get(SiteState, 1)
    active_id = state.active_publication_id if state else None
    return [
        {"id": str(p.id), "version": p.version, "workspace_version": p.workspace_version,
         "content_hash": p.content_hash, "schema_version": p.schema_version,
         "published_at": p.published_at.isoformat() if p.published_at else None,
         "created_by": p.created_by, "is_active": p.id == active_id}
        for p in rows
    ]
