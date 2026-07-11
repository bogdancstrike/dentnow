"""Versioned public snapshot contract (`SiteSnapshotV1`).

Both the active publication and a preview are given this exact shape, so the public
renderer never knows whether data came from the live release or a draft preview.
Unknown block kinds/keys are rejected; SEO structured data is generated from typed
schemas only (never raw administrator JSON-LD).
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SitePublic(_Model):
    site_name: str
    default_locale: str
    default_timezone: str


class LinkPublic(_Model):
    kind: str
    label: str
    value: str
    display_value: str | None = None
    url: str | None = None
    position: int = 0


class NavigationItemPublic(_Model):
    label: str
    target_path: str | None = None
    external_url: str | None = None
    position: int = 0
    children: list["NavigationItemPublic"] = []


class ClinicPublic(_Model):
    slug: str
    name: str
    area: str | None = None
    address_full: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    map_embed_url: str | None = None
    map_link_url: str | None = None
    contacts: list[dict[str, Any]] = []
    hours: list[dict[str, Any]] = []


class SectionPublic(_Model):
    block_type: str
    payload: dict[str, Any]
    position: int = 0


class SeoPublic(_Model):
    title: str | None = None
    description: str | None = None
    canonical_path: str | None = None
    og_media_id: str | None = None
    structured_data: dict[str, Any] | None = None


class PagePublic(_Model):
    path: str
    route_key: str
    template_key: str
    title: str
    indexable: bool = True
    sections: list[SectionPublic] = []
    seo: SeoPublic | None = None


class TreatmentPublic(_Model):
    slug: str
    name: str
    summary: str | None = None
    detail_html: str | None = None
    prices: list[dict[str, Any]] = []


class OfferPublic(_Model):
    slug: str
    name: str
    summary: str | None = None
    badge: str | None = None
    price_amount: float | None = None
    currency: str = "RON"
    starts_at: str | None = None
    ends_at: str | None = None
    features: list[str] = []


class ArticlePublic(_Model):
    slug: str
    title: str
    excerpt: str | None = None
    body_html: str | None = None
    cover_media_id: str | None = None
    published_at: str | None = None


class ReviewPublic(_Model):
    author: str
    review_date: str
    rating: int
    text_body: str | None = None
    source: str | None = None


class EditorialPublic(_Model):
    articles: list[ArticlePublic] = []
    reviews: list[ReviewPublic] = []


class MediaPublic(_Model):
    asset_id: str
    variants: list[str] = []
    alt_text: str | None = None


class SiteSnapshotV1(_Model):
    schema_version: Literal[1] = 1
    site: SitePublic
    links: list[LinkPublic] = []
    navigation: dict[str, list[NavigationItemPublic]] = {}
    clinics: list[ClinicPublic] = []
    pages_by_path: dict[str, PagePublic] = {}
    treatments: list[TreatmentPublic] = []
    offers: list[OfferPublic] = []
    editorial: EditorialPublic = EditorialPublic()
    media: dict[str, MediaPublic] = {}


NavigationItemPublic.model_rebuild()
