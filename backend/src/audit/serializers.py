"""Redacted audit serializer. before/after are already per-action allowlisted; raw
client metadata is not exposed beyond a coarse marker.
"""
from __future__ import annotations

from typing import Any


def serialize_audit(e: Any) -> dict:
    return {
        "id": e.id,
        "actor_subject": e.actor_subject,
        "action": e.action,
        "entity_type": e.entity_type,
        "entity_id": e.entity_id,
        "before": e.before,
        "after": e.after,
        "correlation_id": e.correlation_id,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
