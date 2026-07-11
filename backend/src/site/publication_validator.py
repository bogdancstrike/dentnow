"""Blocking-error validation for a candidate snapshot before publishing."""
from __future__ import annotations

from sqlalchemy import select

from src.editorial.models import LegalDocument
from src.media.models import MediaAsset, MediaDeliveryBlock
from src.site.snapshot_contract import SiteSnapshotV1

# Initially required legal document types (cookies becomes required only when configured).
REQUIRED_LEGAL_TYPES = ("gdpr", "privacy", "terms")


def validate_snapshot(session, snapshot: SiteSnapshotV1) -> list[dict]:
    """Return a list of blocking errors ({code, message, ref}); empty means publishable."""
    errors: list[dict] = []

    # Route uniqueness (dict keys are unique by construction; assert non-empty home).
    paths = list(snapshot.pages_by_path.keys())
    if len(paths) != len(set(paths)):
        errors.append({"code": "route_conflict", "message": "duplicate page paths"})

    # Required active legal documents.
    active_types = {
        d.doc_type
        for d in session.scalars(
            select(LegalDocument).where(LegalDocument.deleted_at.is_(None), LegalDocument.active.is_(True))
        ).all()
    }
    for t in REQUIRED_LEGAL_TYPES:
        if t not in active_types:
            errors.append({"code": "missing_legal", "message": f"no active {t} document", "ref": t})

    # Referenced media must exist, be ready, have alt text (public), and not be blocked.
    for asset_id, media in snapshot.media.items():
        import uuid as _uuid

        try:
            asset = session.get(MediaAsset, _uuid.UUID(asset_id))
        except Exception:
            asset = None
        if asset is None or asset.deleted_at is not None:
            errors.append({"code": "media_missing", "message": "referenced media missing", "ref": asset_id})
            continue
        if asset.readiness != "ready":
            errors.append({"code": "media_not_ready", "message": "referenced media not ready", "ref": asset_id})
        if asset.privacy_class == "public" and not (asset.alt_text and asset.alt_text.strip()):
            errors.append({"code": "media_no_alt", "message": "referenced public media lacks alt text", "ref": asset_id})
        blocked = session.scalar(
            select(MediaDeliveryBlock.id).where(MediaDeliveryBlock.asset_id == asset.id).limit(1)
        )
        if blocked is not None:
            errors.append({"code": "media_blocked", "message": "referenced media has a delivery block", "ref": asset_id})

    return errors
