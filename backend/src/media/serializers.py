"""Media serializers. Never expose object keys or storage credentials publicly; the
admin serializer may include internal keys for operators.
"""
from __future__ import annotations

from typing import Any


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


def serialize_asset(a: Any, variants: list | None = None) -> dict:
    return {
        "id": str(a.id),
        "version": a.version,
        "media_kind": a.media_kind,
        "mime_type": a.mime_type,
        "original_filename": a.original_filename,
        "byte_size": a.byte_size,
        "width": a.width,
        "height": a.height,
        "sha256": a.sha256,
        "alt_text": a.alt_text,
        "caption": a.caption,
        "focal_x": float(a.focal_x) if a.focal_x is not None else None,
        "focal_y": float(a.focal_y) if a.focal_y is not None else None,
        "rights_note": a.rights_note,
        "privacy_class": a.privacy_class,
        "readiness": a.readiness,
        "variants": [
            {"variant": v.variant, "width": v.width, "height": v.height, "byte_size": v.byte_size}
            for v in (variants or [])
        ],
        "created_at": _iso(a.created_at),
        "updated_at": _iso(a.updated_at),
    }


def serialize_consent(c: Any) -> dict:
    return {
        "id": str(c.id),
        "asset_id": str(c.asset_id),
        "scope": c.scope,
        "reviewer": c.reviewer,
        "evidence_reference": c.evidence_reference,
        "obtained_at": _iso(c.obtained_at),
        "expires_at": _iso(c.expires_at),
        "revoked_at": _iso(c.revoked_at),
        "created_at": _iso(c.created_at),
    }
