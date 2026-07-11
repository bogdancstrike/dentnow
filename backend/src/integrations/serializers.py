"""Outbox serializers (read-only ops/observability views)."""
from __future__ import annotations

from typing import Any


def serialize_outbox(e: Any) -> dict:
    return {
        "id": e.id,
        "event_id": str(e.event_id),
        "event_type": e.event_type,
        "aggregate_type": e.aggregate_type,
        "aggregate_id": e.aggregate_id,
        "schema_version": e.schema_version,
        "payload": e.payload,
        "attempts": e.attempts,
        "available_at": e.available_at.isoformat() if e.available_at else None,
        "published_at": e.published_at.isoformat() if e.published_at else None,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
