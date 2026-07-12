"""Treatments, prices, offers, technology, partners (schema slice 4)."""
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
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base
from src.core.mixins import WorkspaceRoot

PRICE_KINDS = ("exact", "from", "range", "on_request")
OFFER_STATUSES = ("draft", "active", "archived")


class TreatmentCategory(WorkspaceRoot, Base):
    __tablename__ = "treatment_categories"
    __table_args__ = (
        Index("uq_treatment_categories_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Treatment(WorkspaceRoot, Base):
    __tablename__ = "treatments"
    __table_args__ = (
        Index("uq_treatments_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_treatments_category", "category_id"),
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("treatment_categories.id", ondelete="SET NULL"), nullable=True
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    detail_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[str | None] = mapped_column(Text, nullable=True)
    visits: Mapped[str | None] = mapped_column(Text, nullable=True)
    anesthesia: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    homepage_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    homepage_label: Mapped[str | None] = mapped_column(Text, nullable=True)
    homepage_icon: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class TreatmentPrice(WorkspaceRoot, Base):
    __tablename__ = "treatment_prices"
    __table_args__ = (
        CheckConstraint("price_kind IN ('exact','from','range','on_request')", name="ck_treatment_prices_kind"),
        CheckConstraint("amount IS NULL OR amount >= 0", name="ck_treatment_prices_amount_nonneg"),
        CheckConstraint("amount_max IS NULL OR amount_max >= 0", name="ck_treatment_prices_amount_max_nonneg"),
        CheckConstraint("old_amount IS NULL OR old_amount >= 0", name="ck_treatment_prices_old_nonneg"),
        CheckConstraint(
            "amount_max IS NULL OR amount IS NULL OR amount_max >= amount",
            name="ck_treatment_prices_range_ordered",
        ),
        CheckConstraint("currency ~ '^[A-Z]{3}$'", name="ck_treatment_prices_currency"),
        Index("ix_treatment_prices_treatment", "treatment_id"),
        Index("ix_treatment_prices_clinic", "clinic_id"),
    )
    treatment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("treatments.id", ondelete="CASCADE"), nullable=False
    )
    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), nullable=True
    )
    price_kind: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'exact'"))
    amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount_max: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    old_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'RON'"))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class TreatmentFaq(WorkspaceRoot, Base):
    __tablename__ = "treatment_faqs"
    __table_args__ = (Index("ix_treatment_faqs_treatment", "treatment_id"),)
    treatment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("treatments.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ClinicTreatment(Base):
    __tablename__ = "clinic_treatments"
    __table_args__ = (
        Index("ix_clinic_treatments_clinic", "clinic_id"),
        Index("ix_clinic_treatments_treatment", "treatment_id"),
    )
    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), primary_key=True
    )
    treatment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("treatments.id", ondelete="CASCADE"), primary_key=True
    )


class Offer(WorkspaceRoot, Base):
    __tablename__ = "offers"
    __table_args__ = (
        CheckConstraint("status IN ('draft','active','archived')", name="ck_offers_status"),
        CheckConstraint("price_amount IS NULL OR price_amount >= 0", name="ck_offers_price_nonneg"),
        CheckConstraint("old_amount IS NULL OR old_amount >= 0", name="ck_offers_old_nonneg"),
        CheckConstraint("ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at", name="ck_offers_dates"),
        CheckConstraint("currency ~ '^[A-Z]{3}$'", name="ck_offers_currency"),
        Index("uq_offers_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    badge: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    old_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'RON'"))
    starts_at = mapped_column(Text, nullable=True)  # ISO date string; validity window
    ends_at = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class OfferFeature(WorkspaceRoot, Base):
    __tablename__ = "offer_features"
    __table_args__ = (Index("ix_offer_features_offer", "offer_id"),)
    offer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class OfferClinic(Base):
    __tablename__ = "offer_clinics"
    __table_args__ = (
        Index("ix_offer_clinics_offer", "offer_id"),
        Index("ix_offer_clinics_clinic", "clinic_id"),
    )
    offer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"), primary_key=True
    )
    clinic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"), primary_key=True
    )


class OfferTreatment(Base):
    __tablename__ = "offer_treatments"
    __table_args__ = (
        Index("ix_offer_treatments_offer", "offer_id"),
        Index("ix_offer_treatments_treatment", "treatment_id"),
    )
    offer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"), primary_key=True
    )
    treatment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("treatments.id", ondelete="CASCADE"), primary_key=True
    )


class Technology(WorkspaceRoot, Base):
    __tablename__ = "technologies"
    __table_args__ = (Index("ix_technologies_position", "position"),)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_technologies_media_id"), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Partner(WorkspaceRoot, Base):
    __tablename__ = "partners"
    __table_args__ = (Index("ix_partners_position", "position"),)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    relationship_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    badge: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_partners_logo_media_id"), nullable=True)
    rights_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    link_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
