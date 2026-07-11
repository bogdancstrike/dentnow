"""Read-only audit queries (append-only ledger; no update/delete path exists)."""
from __future__ import annotations

from sqlalchemy import func, select

from src.audit.models import AuditEvent
from src.core.pagination import PageRequest, page_envelope
from src.audit.serializers import serialize_audit


def query_audit(session, req: PageRequest, *, action=None, entity_type=None, entity_id=None, actor=None) -> dict:
    base = select(AuditEvent)
    if action:
        base = base.where(AuditEvent.action == action)
    if entity_type:
        base = base.where(AuditEvent.entity_type == entity_type)
    if entity_id:
        base = base.where(AuditEvent.entity_id == entity_id)
    if actor:
        base = base.where(AuditEvent.actor_subject == actor)
    total = session.scalar(select(func.count()).select_from(base.subquery())) or 0
    base = base.order_by(AuditEvent.created_at.desc()).limit(req.page_size).offset(req.offset)
    items = [serialize_audit(e) for e in session.scalars(base).all()]
    return page_envelope(items, total, req)


def get_audit(session, event_id: int) -> dict | None:
    ev = session.get(AuditEvent, event_id)
    return serialize_audit(ev) if ev is not None else None
