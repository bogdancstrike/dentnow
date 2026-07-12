"""Clinic domain services (extend the shared CrudService) + clinic-scope provider."""
from __future__ import annotations

import re
import uuid
from datetime import time as dt_time
from typing import Any

from sqlalchemy import select

from src.clinics.models import (
    AdminPrincipalClinic,
    Clinic,
    ClinicContact,
    ClinicFaq,
    ClinicHours,
    ClinicTransitItem,
    Doctor,
    DoctorClinic,
)
from src.clinics.serializers import (
    serialize_clinic,
    serialize_contact,
    serialize_doctor,
    serialize_faq,
    serialize_hours,
    serialize_transit,
)
from src.core.crud import CrudService
from src.core.errors import ConflictError, NotFoundError, ValidationError
from src.core.db import session_scope


def _normalize_phone(value: str) -> str:
    digits = re.sub(r"[^\d+]", "", value or "")
    return digits


def _parse_time(value: str | None) -> dt_time | None:
    if not value:
        return None
    try:
        parts = [int(p) for p in value.split(":")]
        return dt_time(*parts[:3])
    except (ValueError, TypeError) as exc:
        raise ValidationError(f"invalid time: {value}") from exc


class ClinicService(CrudService):
    model = Clinic
    entity_type = "clinic"
    event_prefix = "clinic"
    sortable = ("created_at", "updated_at", "name", "slug", "position", "status")
    search_columns = ("name", "slug", "area")
    clinic_scope_column = "id"  # a manager only sees assigned clinics

    def serialize(self, obj: Any) -> dict:
        return serialize_clinic(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        return dict(data)

    def to_update_values(self, data: dict, obj: Any) -> dict:
        return dict(data)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        # Unique live slug (excluding self on update).
        q = select(Clinic.id).where(Clinic.slug == obj.slug, Clinic.deleted_at.is_(None))
        if not creating:
            q = q.where(Clinic.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("clinic slug already in use", details={"field": "slug"})

    def check_deletable(self, obj: Any) -> None:
        # Refuse delete if doctors are still mapped to this clinic.
        mapped = self.session.scalar(
            select(DoctorClinic.doctor_id).where(DoctorClinic.clinic_id == obj.id).limit(1)
        )
        if mapped is not None:
            raise ConflictError("clinic still has doctor assignments")


class _ClinicChildService(CrudService):
    """Child rows scoped by their parent clinic_id."""

    clinic_scope_column = "clinic_id"

    def to_create_kwargs(self, data: dict) -> dict:
        data = dict(data)
        data["clinic_id"] = uuid.UUID(str(data["clinic_id"]))
        return data


class ContactService(_ClinicChildService):
    model = ClinicContact
    entity_type = "clinic_contact"
    event_prefix = "clinic"
    sortable = ("position", "created_at")
    search_columns = ("display_value", "label")

    def serialize(self, obj: Any) -> dict:
        return serialize_contact(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        data = super().to_create_kwargs(data)
        if not data.get("normalized_value"):
            data["normalized_value"] = _normalize_phone(data["display_value"])
        return data

    def to_update_values(self, data: dict, obj: Any) -> dict:
        data = dict(data)
        if "display_value" in data and not data.get("normalized_value"):
            data["normalized_value"] = _normalize_phone(data["display_value"])
        return data


class HoursService(_ClinicChildService):
    model = ClinicHours
    entity_type = "clinic_hours"
    event_prefix = "clinic"
    sortable = ("weekday", "created_at")

    def serialize(self, obj: Any) -> dict:
        return serialize_hours(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        data = super().to_create_kwargs(data)
        data["opens_at"] = _parse_time(data.get("opens_at"))
        data["closes_at"] = _parse_time(data.get("closes_at"))
        return data

    def to_update_values(self, data: dict, obj: Any) -> dict:
        data = dict(data)
        if "opens_at" in data:
            data["opens_at"] = _parse_time(data["opens_at"])
        if "closes_at" in data:
            data["closes_at"] = _parse_time(data["closes_at"])
        return data

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        q = select(ClinicHours.id).where(
            ClinicHours.clinic_id == obj.clinic_id,
            ClinicHours.weekday == obj.weekday,
            ClinicHours.deleted_at.is_(None),
        )
        if not creating:
            q = q.where(ClinicHours.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("hours already set for this weekday", details={"field": "weekday"})


class TransitService(_ClinicChildService):
    model = ClinicTransitItem
    entity_type = "clinic_transit"
    event_prefix = "clinic"
    sortable = ("position", "created_at")
    search_columns = ("label", "detail")

    def serialize(self, obj: Any) -> dict:
        return serialize_transit(obj)


class FaqService(_ClinicChildService):
    model = ClinicFaq
    entity_type = "clinic_faq"
    event_prefix = "clinic"
    sortable = ("position", "created_at")
    search_columns = ("question", "answer")

    def serialize(self, obj: Any) -> dict:
        return serialize_faq(obj)


class DoctorService(CrudService):
    model = Doctor
    entity_type = "doctor"
    event_prefix = "doctor"
    sortable = ("created_at", "updated_at", "name", "position")
    search_columns = ("name", "slug", "role", "focus")

    def serialize(self, obj: Any) -> dict:
        return serialize_doctor(obj)

    @staticmethod
    def _coerce_portrait(data: dict) -> dict:
        data = dict(data)
        if "portrait_media_id" in data:
            value = data["portrait_media_id"]
            data["portrait_media_id"] = uuid.UUID(str(value)) if value else None
        return data

    def to_create_kwargs(self, data: dict) -> dict:
        return self._coerce_portrait(data)

    def to_update_values(self, data: dict, obj: Any) -> dict:
        return self._coerce_portrait(data)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        q = select(Doctor.id).where(Doctor.slug == obj.slug, Doctor.deleted_at.is_(None))
        if not creating:
            q = q.where(Doctor.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("doctor slug already in use", details={"field": "slug"})


# ── doctor-clinic mapping (simple join, not a workspace root) ─────────────────
def assign_doctor_clinic(session, principal, doctor_id: str, clinic_id: str) -> dict:
    d_id, c_id = uuid.UUID(doctor_id), uuid.UUID(clinic_id)
    if session.get(Doctor, d_id) is None:
        raise NotFoundError("doctor not found")
    if session.get(Clinic, c_id) is None:
        raise NotFoundError("clinic not found")
    if not principal.can_access_clinic(c_id):
        raise NotFoundError("clinic not found")
    exists = session.scalar(
        select(DoctorClinic.doctor_id).where(
            DoctorClinic.doctor_id == d_id, DoctorClinic.clinic_id == c_id
        )
    )
    if exists is None:
        session.add(DoctorClinic(doctor_id=d_id, clinic_id=c_id))
        session.flush()
    return {"doctor_id": doctor_id, "clinic_id": clinic_id}


def remove_doctor_clinic(session, principal, doctor_id: str, clinic_id: str) -> None:
    d_id, c_id = uuid.UUID(doctor_id), uuid.UUID(clinic_id)
    if not principal.can_access_clinic(c_id):
        raise NotFoundError("clinic not found")
    row = session.get(DoctorClinic, {"doctor_id": d_id, "clinic_id": c_id})
    if row is not None:
        session.delete(row)
        session.flush()


# ── DB-backed clinic-scope provider (wired as the IAM ClinicScopeProvider) ────
def db_clinic_scope_provider(subject: str) -> frozenset[uuid.UUID]:
    try:
        with session_scope() as session:
            rows = session.scalars(
                select(AdminPrincipalClinic.clinic_id).where(
                    AdminPrincipalClinic.subject == subject
                )
            ).all()
            return frozenset(rows)
    except Exception:  # pragma: no cover - scope resolution must not break auth
        return frozenset()
