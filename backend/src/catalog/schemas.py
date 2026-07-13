"""Pydantic validation for catalog resources."""
from __future__ import annotations

import re
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CURRENCY_RE = re.compile(r"^[A-Z]{3}$")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _validate_slug(v):
    if v is not None and not SLUG_RE.match(v):
        raise ValueError("slug must be kebab-case")
    return v


class CategoryCreate(_Strict):
    slug: str
    label: str
    description: Optional[str] = None
    position: int = 0
    _s = field_validator("slug")(classmethod(lambda cls, v: _validate_slug(v)))


class CategoryUpdate(_Strict):
    slug: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None


class TreatmentCreate(_Strict):
    slug: str
    name: str
    category_id: Optional[str] = None
    summary: Optional[str] = None
    detail_markdown: Optional[str] = None
    duration: Optional[str] = None
    visits: Optional[str] = None
    anesthesia: Optional[str] = None
    active: bool = True
    homepage_featured: bool = False
    homepage_label: Optional[str] = None
    homepage_icon: Optional[str] = None
    position: int = 0
    _s = field_validator("slug")(classmethod(lambda cls, v: _validate_slug(v)))


class TreatmentUpdate(_Strict):
    slug: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[str] = None
    summary: Optional[str] = None
    detail_markdown: Optional[str] = None
    duration: Optional[str] = None
    visits: Optional[str] = None
    anesthesia: Optional[str] = None
    active: Optional[bool] = None
    homepage_featured: Optional[bool] = None
    homepage_label: Optional[str] = None
    homepage_icon: Optional[str] = None
    position: Optional[int] = None


class PriceCreate(_Strict):
    treatment_id: str
    clinic_id: Optional[str] = None
    price_kind: str = "exact"
    amount: Optional[float] = Field(default=None, ge=0)
    amount_max: Optional[float] = Field(default=None, ge=0)
    old_amount: Optional[float] = Field(default=None, ge=0)
    currency: str = "RON"
    note: Optional[str] = None
    position: int = 0

    @field_validator("price_kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if v not in ("exact", "from", "range", "on_request"):
            raise ValueError("invalid price kind")
        return v

    @field_validator("currency")
    @classmethod
    def _cur(cls, v: str) -> str:
        if not CURRENCY_RE.match(v):
            raise ValueError("currency must be a 3-letter code")
        return v

    @model_validator(mode="after")
    def _rules(self):
        if self.price_kind == "range":
            if self.amount is None or self.amount_max is None:
                raise ValueError("range price needs amount and amount_max")
            if self.amount_max < self.amount:
                raise ValueError("amount_max must be >= amount")
        if self.price_kind in ("exact", "from") and self.amount is None:
            raise ValueError(f"{self.price_kind} price needs an amount")
        return self


class PriceUpdate(_Strict):
    clinic_id: Optional[str] = None
    price_kind: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0)
    amount_max: Optional[float] = Field(default=None, ge=0)
    old_amount: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = None
    note: Optional[str] = None
    position: Optional[int] = None


class TreatmentFaqCreate(_Strict):
    treatment_id: str
    question: str
    answer: str
    position: int = 0


class TreatmentFaqUpdate(_Strict):
    question: Optional[str] = None
    answer: Optional[str] = None
    position: Optional[int] = None


def _coerce_features(v):
    """Accept either a list of labels or a single comma-separated string."""
    if v is None:
        return None
    if isinstance(v, str):
        v = v.split(",")
    return [s.strip() for s in v if s is not None and str(s).strip()]


def _coerce_resource_ids(v):
    """Normalize a multi-select payload into unique canonical UUID strings."""
    if v is None:
        return None
    if not isinstance(v, (list, tuple, set)):
        raise ValueError("resource ids must be a list")
    normalized = []
    for raw_id in v:
        try:
            resource_id = str(uuid.UUID(str(raw_id)))
        except (ValueError, TypeError, AttributeError) as exc:
            raise ValueError("resource ids must contain valid UUIDs") from exc
        if resource_id not in normalized:
            normalized.append(resource_id)
    return normalized


class OfferCreate(_Strict):
    slug: str
    name: str
    summary: Optional[str] = None
    badge: Optional[str] = None
    price_amount: Optional[float] = Field(default=None, ge=0)
    old_amount: Optional[float] = Field(default=None, ge=0)
    currency: str = "RON"
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    status: str = "draft"
    featured: bool = False
    position: int = 0
    # Convenience: manage the offer_features child rows inline from the editor.
    features: Optional[list[str]] = None
    treatment_ids: Optional[list[str]] = None
    clinic_ids: Optional[list[str]] = None
    _s = field_validator("slug")(classmethod(lambda cls, v: _validate_slug(v)))
    _f = field_validator("features", mode="before")(classmethod(lambda cls, v: _coerce_features(v)))
    _t = field_validator("treatment_ids", mode="before")(classmethod(lambda cls, v: _coerce_resource_ids(v)))
    _c = field_validator("clinic_ids", mode="before")(classmethod(lambda cls, v: _coerce_resource_ids(v)))

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in ("draft", "active", "archived"):
            raise ValueError("invalid status")
        return v

    @model_validator(mode="after")
    def _dates(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class OfferUpdate(_Strict):
    slug: Optional[str] = None
    name: Optional[str] = None
    summary: Optional[str] = None
    badge: Optional[str] = None
    price_amount: Optional[float] = Field(default=None, ge=0)
    old_amount: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    position: Optional[int] = None
    features: Optional[list[str]] = None
    treatment_ids: Optional[list[str]] = None
    clinic_ids: Optional[list[str]] = None
    _f = field_validator("features", mode="before")(classmethod(lambda cls, v: _coerce_features(v)))
    _t = field_validator("treatment_ids", mode="before")(classmethod(lambda cls, v: _coerce_resource_ids(v)))
    _c = field_validator("clinic_ids", mode="before")(classmethod(lambda cls, v: _coerce_resource_ids(v)))


class OfferFeatureCreate(_Strict):
    offer_id: str
    label: str
    position: int = 0


class OfferFeatureUpdate(_Strict):
    label: Optional[str] = None
    position: Optional[int] = None


class TechnologyCreate(_Strict):
    name: str
    description: Optional[str] = None
    active: bool = True
    position: int = 0


class TechnologyUpdate(_Strict):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    position: Optional[int] = None


class PartnerCreate(_Strict):
    name: str
    relationship_type: Optional[str] = None
    badge: Optional[str] = None
    rights_note: Optional[str] = None
    link_url: Optional[str] = None
    active: bool = True
    position: int = 0


class PartnerUpdate(_Strict):
    name: Optional[str] = None
    relationship_type: Optional[str] = None
    badge: Optional[str] = None
    rights_note: Optional[str] = None
    link_url: Optional[str] = None
    active: Optional[bool] = None
    position: Optional[int] = None
