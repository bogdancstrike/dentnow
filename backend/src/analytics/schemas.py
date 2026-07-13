"""Strict public analytics contracts."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from src.analytics.models import EVENT_TYPES, TARGET_TYPES


class AnalyticsEventInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event_type: str
    path: str = Field(min_length=1, max_length=300)
    target_type: str | None = None
    target_key: str | None = Field(default=None, max_length=160)
    section_id: str | None = Field(default=None, max_length=120)
    referrer: str | None = Field(default=None, max_length=500)
    engaged_seconds: int | None = Field(default=None, ge=0, le=3600)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geo_accuracy_m: int | None = Field(default=None, ge=0, le=100000)
    consent_granted: bool = False

    @model_validator(mode="after")
    def coordinates_are_paired(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self

    @field_validator("event_type")
    @classmethod
    def valid_event_type(cls, value: str) -> str:
        if value not in EVENT_TYPES:
            raise ValueError("unsupported analytics event")
        return value

    @field_validator("path")
    @classmethod
    def valid_path(cls, value: str) -> str:
        # Queries/fragments can contain personal data and are never accepted.
        if not value.startswith("/") or "?" in value or "#" in value or "\x00" in value:
            raise ValueError("path must be a query-free local path")
        return value

    @field_validator("target_type")
    @classmethod
    def valid_target_type(cls, value: str | None) -> str | None:
        if value is not None and value not in TARGET_TYPES:
            raise ValueError("unsupported analytics target")
        return value
