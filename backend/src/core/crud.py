"""Reusable workspace-CRUD service base.

A ``CrudService`` is constructed with the active SQLAlchemy session and the calling
principal; it never opens or commits its own transaction (the qf handler wraps each
call in ``session_scope``, and tests wrap it in a rolled-back transaction). Every
mutation writes an audit event, enqueues an outbox event, and bumps the workspace
version in that same transaction.

Clinic scoping is centralized: set ``clinic_scope_column`` and a clinic manager is
transparently limited to assigned clinics on list/get/search/mutation — omitting an
unassigned record is preferred to revealing it.
"""
from __future__ import annotations

import uuid
from typing import Any, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.audit.service import write_audit
from src.core.clock import utcnow
from src.core.correlation import get_correlation_id
from src.core.errors import NotFoundError, PermissionDeniedError
from src.core.etag import check_version, make_etag, parse_if_match
from src.core.pagination import PageRequest, page_envelope
from src.integrations.outbox import enqueue_event
from src.iam.principal import Principal
from src.site.workspace import bump_workspace_version


class CrudService:
    model: Any = None
    entity_type: str = "entity"
    event_prefix: str | None = None  # e.g. "clinic" -> clinic.created.v1
    default_sort: str = "created_at"
    sortable: tuple[str, ...] = ("created_at", "updated_at")
    search_columns: tuple[str, ...] = ()
    # When set, a clinic manager is limited to rows whose value is in their scopes.
    clinic_scope_column: str | None = None

    def __init__(self, session: Session, principal: Principal):
        self.session = session
        self.principal = principal

    # ── hooks a subclass provides ────────────────────────────────────────────
    def serialize(self, obj: Any) -> dict:
        raise NotImplementedError

    def to_create_kwargs(self, data: dict) -> dict:
        return dict(data)

    def to_update_values(self, data: dict, obj: Any) -> dict:
        return dict(data)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        """Uniqueness/target validation etc. Raise a DentNowError to reject."""

    def check_deletable(self, obj: Any) -> None:
        """Raise ConflictError if a required live relationship references this row."""

    # ── clinic scoping ───────────────────────────────────────────────────────
    def _scope_ids(self) -> frozenset[uuid.UUID]:
        return self.principal.clinic_scopes

    def _apply_scope(self, query):
        if self.clinic_scope_column and self.principal.is_clinic_scoped:
            col = getattr(self.model, self.clinic_scope_column)
            return query.where(col.in_(self._scope_ids() or {uuid.UUID(int=0)}))
        return query

    def _check_scope_obj(self, obj: Any) -> None:
        if self.clinic_scope_column and self.principal.is_clinic_scoped:
            value = getattr(obj, self.clinic_scope_column)
            if value not in self._scope_ids():
                # Prefer "not found" over revealing an out-of-scope record.
                raise NotFoundError(f"{self.entity_type} not found")

    # ── read ─────────────────────────────────────────────────────────────────
    def list(self, req: PageRequest) -> dict:
        base = select(self.model).where(self.model.deleted_at.is_(None))
        base = self._apply_scope(base)
        if req.q and self.search_columns:
            term = f"%{req.q.lower()}%"
            base = base.where(
                or_(*[func.lower(getattr(self.model, c)).like(term) for c in self.search_columns])
            )
        total = self.session.scalar(select(func.count()).select_from(base.subquery())) or 0
        sort_col = getattr(self.model, req.sort or self.default_sort)
        base = base.order_by(sort_col.desc() if req.order == "desc" else sort_col.asc())
        base = base.limit(req.page_size).offset(req.offset)
        items = [self.serialize(o) for o in self.session.scalars(base).all()]
        return page_envelope(items, total, req)

    def _get_live(self, obj_id: Any):
        obj = self.session.get(self.model, obj_id)
        if obj is None or obj.deleted_at is not None:
            raise NotFoundError(f"{self.entity_type} not found")
        self._check_scope_obj(obj)
        return obj

    def get(self, obj_id: Any) -> tuple[dict, str]:
        obj = self._get_live(obj_id)
        return self.serialize(obj), make_etag(obj.version)

    # ── write ────────────────────────────────────────────────────────────────
    def create(self, data: dict) -> tuple[dict, str]:
        cid = get_correlation_id()
        obj = self.model(
            **self.to_create_kwargs(data),
            created_by=self.principal.subject,
            updated_by=self.principal.subject,
        )
        self.before_write(obj, data, creating=True)
        self._check_scope_obj(obj)
        self.session.add(obj)
        self.session.flush()
        after = self.serialize(obj)
        write_audit(
            self.session, action=f"{self.entity_type}.create", entity_type=self.entity_type,
            entity_id=obj.id, principal=self.principal, after=after, correlation_id=cid,
        )
        self._emit("created", obj, cid)
        bump_workspace_version(self.session)
        return after, make_etag(obj.version)

    def update(self, obj_id: Any, data: dict, if_match: str | None) -> tuple[dict, str]:
        expected = parse_if_match(if_match)
        cid = get_correlation_id()
        obj = self._get_live(obj_id)
        before = self.serialize(obj)
        check_version(obj.version, expected, before)
        for key, value in self.to_update_values(data, obj).items():
            setattr(obj, key, value)
        obj.version += 1
        obj.updated_by = self.principal.subject
        self.before_write(obj, data, creating=False)
        self.session.flush()
        after = self.serialize(obj)
        write_audit(
            self.session, action=f"{self.entity_type}.update", entity_type=self.entity_type,
            entity_id=obj.id, principal=self.principal, before=before, after=after, correlation_id=cid,
        )
        self._emit("updated", obj, cid)
        bump_workspace_version(self.session)
        return after, make_etag(obj.version)

    def delete(self, obj_id: Any, if_match: str | None) -> None:
        expected = parse_if_match(if_match)
        cid = get_correlation_id()
        obj = self._get_live(obj_id)
        before = self.serialize(obj)
        check_version(obj.version, expected, before)
        self.check_deletable(obj)
        obj.deleted_at = utcnow()
        obj.version += 1
        obj.updated_by = self.principal.subject
        self.session.flush()
        write_audit(
            self.session, action=f"{self.entity_type}.delete", entity_type=self.entity_type,
            entity_id=obj.id, principal=self.principal, before=before, correlation_id=cid,
        )
        self._emit("deleted", obj, cid)
        bump_workspace_version(self.session)

    def _emit(self, verb: str, obj: Any, cid: str) -> None:
        if not self.event_prefix:
            return
        enqueue_event(
            self.session,
            event_type=f"{self.event_prefix}.{verb}.v1",
            aggregate_type=self.entity_type,
            aggregate_id=obj.id,
            payload={"id": str(obj.id)},
            correlation_id=cid,
        )
