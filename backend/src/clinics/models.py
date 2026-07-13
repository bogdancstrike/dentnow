"""Clinics, contacts, hours, transit, FAQs, doctors, and scope tables (schema slice 3)."""
from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    Time,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base
from src.core.mixins import WorkspaceRoot

CLINIC_STATUSES = ("active", "coming_soon", "closed")
CONTACT_KINDS = ("phone", "whatsapp", "email", "booking", "social")


class Clinic(WorkspaceRoot, Base):
    __tablename__ = "clinics"
    __table_args__ = (
        CheckConstraint("status IN ('active','coming_soon','closed')", name="ck_clinics_status"),
        CheckConstraint("latitude IS NULL OR (latitude BETWEEN -90 AND 90)", name="ck_clinics_lat"),
        CheckConstraint("longitude IS NULL OR (longitude BETWEEN -180 AND 180)", name="ck_clinics_lng"),
        Index("uq_clinics_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    slug: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    area: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_line: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_full: Mapped[str | None] = mapped_column(Text, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    map_embed_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    map_link_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'active'"))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ClinicContact(WorkspaceRoot, Base):
    __tablename__ = "clinic_contacts"
    __table_args__ = (
        CheckConstraint("kind IN ('phone','whatsapp','email','booking','social')", name="ck_clinic_contacts_kind"),
        Index("ix_clinic_contacts_clinic", "clinic_id"),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    display_value: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_value: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    label: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class ClinicHours(WorkspaceRoot, Base):
    __tablename__ = "clinic_hours"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_clinic_hours_weekday"),
        Index(
            "uq_clinic_hours_clinic_weekday_live",
            "clinic_id",
            "weekday",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon..6=Sun
    opens_at = mapped_column(Time, nullable=True)
    closes_at = mapped_column(Time, nullable=True)
    closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class ClinicTransitItem(WorkspaceRoot, Base):
    __tablename__ = "clinic_transit_items"
    __table_args__ = (Index("ix_clinic_transit_clinic", "clinic_id"),)

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    mode: Mapped[str | None] = mapped_column(Text, nullable=True)  # metro / bus / parking
    label: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ClinicFaq(WorkspaceRoot, Base):
    __tablename__ = "clinic_faqs"
    __table_args__ = (Index("ix_clinic_faqs_clinic", "clinic_id"),)

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Doctor(WorkspaceRoot, Base):
    __tablename__ = "doctors"
    __table_args__ = (
        Index("uq_doctors_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    slug: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str | None] = mapped_column(Text, nullable=True)
    focus: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    approach: Mapped[str | None] = mapped_column(Text, nullable=True)
    credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    portrait_media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_doctors_portrait_media_id"), nullable=True)
    workspace_media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_doctors_workspace_media_id"), nullable=True)
    secondary_media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_doctors_secondary_media_id"), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class DoctorClinic(Base):
    __tablename__ = "doctor_clinics"
    # The composite primary key (doctor_id, clinic_id) already enforces uniqueness.
    __table_args__ = (
        Index("ix_doctor_clinics_doctor", "doctor_id"),
        Index("ix_doctor_clinics_clinic", "clinic_id"),
    )

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), primary_key=True
    )
    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), primary_key=True
    )


class AdminPrincipalClinic(Base):
    """Clinic-manager scope mapping (subject -> clinic_id)."""

    __tablename__ = "admin_principal_clinics"
    __table_args__ = (
        Index("ix_admin_principal_clinics_subject", "subject"),
        Index("ix_admin_principal_clinics_clinic", "clinic_id"),
    )

    subject: Mapped[str] = mapped_column(Text, primary_key=True)
    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), primary_key=True
    )
