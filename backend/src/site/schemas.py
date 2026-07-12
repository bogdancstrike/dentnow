"""Pydantic request validation for site/navigation/page resources."""
from __future__ import annotations

import re
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.site.models import LINK_KINDS, TEMPLATE_KEYS

PATH_RE = re.compile(r"^/[A-Za-z0-9/_-]*$")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SiteSettingsUpdate(_Strict):
    site_name: Optional[str] = None
    default_locale: Optional[str] = None
    default_timezone: Optional[str] = None


class LinkCreate(_Strict):
    kind: str
    label: str
    value: str
    display_value: Optional[str] = None
    url: Optional[str] = None
    position: int = 0
    enabled: bool = True

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if v not in LINK_KINDS:
            raise ValueError(f"invalid link kind: {v}")
        return v


class LinkUpdate(_Strict):
    kind: Optional[str] = None
    label: Optional[str] = None
    value: Optional[str] = None
    display_value: Optional[str] = None
    url: Optional[str] = None
    position: Optional[int] = None
    enabled: Optional[bool] = None


class HomepageServiceCreate(_Strict):
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    link: Optional[str] = None
    position: int = 0
    active: bool = True


class HomepageServiceUpdate(_Strict):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    link: Optional[str] = None
    position: Optional[int] = None
    active: Optional[bool] = None


class GalleryImageCreate(_Strict):
    title: str
    media_id: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    position: int = 0
    active: bool = True


class GalleryImageUpdate(_Strict):
    title: Optional[str] = None
    media_id: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    position: Optional[int] = None
    active: Optional[bool] = None


class MenuCreate(_Strict):
    key: str
    label: str


class MenuUpdate(_Strict):
    key: Optional[str] = None
    label: Optional[str] = None


class NavItemCreate(_Strict):
    menu_id: str
    label: str
    parent_id: Optional[str] = None
    target_page_id: Optional[str] = None
    external_url: Optional[str] = None
    position: int = 0
    enabled: bool = True


class NavItemUpdate(_Strict):
    label: Optional[str] = None
    parent_id: Optional[str] = None
    target_page_id: Optional[str] = None
    external_url: Optional[str] = None
    position: Optional[int] = None
    enabled: Optional[bool] = None


class PageCreate(_Strict):
    path: str
    route_key: str
    template_key: str
    title: str
    enabled: bool = True
    indexable: bool = True

    @field_validator("path")
    @classmethod
    def _path(cls, v: str) -> str:
        if not PATH_RE.match(v):
            raise ValueError("path must start with / and be url-safe")
        return v

    @field_validator("template_key")
    @classmethod
    def _template(cls, v: str) -> str:
        if v not in TEMPLATE_KEYS:
            raise ValueError(f"unsupported template: {v}")
        return v


class PageUpdate(_Strict):
    path: Optional[str] = None
    route_key: Optional[str] = None
    template_key: Optional[str] = None
    title: Optional[str] = None
    enabled: Optional[bool] = None
    indexable: Optional[bool] = None

    @field_validator("template_key")
    @classmethod
    def _template(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TEMPLATE_KEYS:
            raise ValueError(f"unsupported template: {v}")
        return v


class SectionCreate(_Strict):
    page_id: str
    block_type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    position: int = 0


class SectionUpdate(_Strict):
    block_type: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    position: Optional[int] = None


class SeoCreate(_Strict):
    page_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    canonical_path: Optional[str] = None
    structured_data: Optional[dict[str, Any]] = None


class SeoUpdate(_Strict):
    title: Optional[str] = None
    description: Optional[str] = None
    canonical_path: Optional[str] = None
    structured_data: Optional[dict[str, Any]] = None
