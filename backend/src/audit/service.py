"""Audit write helper. Uses the caller-provided serialized before/after (already
allowlisted by the resource serializer) — never a generic ORM dump. Task 21 adds
schema-specific redaction and DB grants/triggers that forbid update/delete.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from src.audit.models import AuditEvent


def write_audit(
    session: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: Any = None,
    principal: Any = None,
    before: dict | None = None,
    after: dict | None = None,
    correlation_id: str | None = None,
) -> None:
    session.add(
        AuditEvent(
            actor_subject=getattr(principal, "subject", None),
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            before=before,
            after=after,
            correlation_id=correlation_id,
        )
    )
