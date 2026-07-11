"""Pydantic request validation for clinic resources.

qf's RESTX model vocabulary is intentionally limited, so complex request validation
uses Pydantic (architecture §8.7). Create requires the full shape; update is a
partial (only provided fields change).
"""
from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ClinicCreate(_Strict):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1)
    area: Optional[str] = None
    address_line: Optional[str] = None
    address_detail: Optional[str] = None
    address_full: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    map_embed_url: Optional[str] = None
    map_link_url: Optional[str] = None
    status: str = "active"
    position: int = 0

    @field_validator("slug")
    @classmethod
    def _slug(cls, v: str) -> str:
        if not SLUG_RE.match(v):
            raise ValueError("slug must be kebab-case")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in ("active", "coming_soon", "closed"):
            raise ValueError("invalid status")
        return v


class ClinicUpdate(_Strict):
    slug: Optional[str] = None
    name: Optional[str] = None
    area: Optional[str] = None
    address_line: Optional[str] = None
    address_detail: Optional[str] = None
    address_full: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    map_embed_url: Optional[str] = None
    map_link_url: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None

    @field_validator("slug")
    @classmethod
    def _slug(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not SLUG_RE.match(v):
            raise ValueError("slug must be kebab-case")
        return v


class ContactCreate(_Strict):
    clinic_id: str
    kind: str
    display_value: str
    normalized_value: Optional[str] = None
    url: Optional[str] = None
    label: Optional[str] = None
    position: int = 0
    is_primary: bool = False

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if v not in ("phone", "whatsapp", "email", "booking"):
            raise ValueError("invalid contact kind")
        return v


class ContactUpdate(_Strict):
    kind: Optional[str] = None
    display_value: Optional[str] = None
    normalized_value: Optional[str] = None
    url: Optional[str] = None
    label: Optional[str] = None
    position: Optional[int] = None
    is_primary: Optional[bool] = None


class HoursCreate(_Strict):
    clinic_id: str
    weekday: int = Field(ge=0, le=6)
    opens_at: Optional[str] = None
    closes_at: Optional[str] = None
    closed: bool = False


class HoursUpdate(_Strict):
    weekday: Optional[int] = Field(default=None, ge=0, le=6)
    opens_at: Optional[str] = None
    closes_at: Optional[str] = None
    closed: Optional[bool] = None


class DoctorCreate(_Strict):
    slug: str
    name: str
    role: Optional[str] = None
    focus: Optional[str] = None
    credentials: Optional[str] = None
    active: bool = True
    position: int = 0

    @field_validator("slug")
    @classmethod
    def _slug(cls, v: str) -> str:
        if not SLUG_RE.match(v):
            raise ValueError("slug must be kebab-case")
        return v


class DoctorUpdate(_Strict):
    slug: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    focus: Optional[str] = None
    credentials: Optional[str] = None
    active: Optional[bool] = None
    position: Optional[int] = None
