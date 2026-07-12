"""Site, navigation, page, publication, and preview tables (schema slice 1)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.core.clock import uuid7
from src.core.db import Base
from src.core.mixins import TimestampMixin, WorkspaceRoot

# Supported page templates and section block types are code, not data. Publication
# validation rejects any page/section outside these registries.
TEMPLATE_KEYS = (
    "home", "treatment-index", "treatment-detail", "clinic-detail",
    "article-index", "article-detail", "quiz", "legal", "offers-index",
    "generic",
)
LINK_KINDS = ("phone", "whatsapp", "email", "social", "review", "booking", "map")


class SiteState(Base):
    """Singleton row holding site identity, workspace version, and active publication."""

    __tablename__ = "site_state"
    __table_args__ = (CheckConstraint("id = 1", name="ck_site_state_singleton"),)

    id: Mapped[int] = mapped_column(
        SmallInteger, primary_key=True, autoincrement=False, server_default=text("1")
    )
    site_name: Mapped[str] = mapped_column(Text, nullable=False, default="DentNow")
    default_locale: Mapped[str] = mapped_column(Text, nullable=False, default="ro-RO")
    default_timezone: Mapped[str] = mapped_column(
        Text, nullable=False, default="Europe/Bucharest"
    )
    workspace_version: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    active_publication_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("site_publications.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class SiteLink(WorkspaceRoot, Base):
    __tablename__ = "site_links"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('phone','whatsapp','email','social','review','booking','map')",
            name="ck_site_links_kind",
        ),
        Index(
            "uq_site_links_kind_label_live",
            "kind",
            "label",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    kind: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    display_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class NavigationMenu(WorkspaceRoot, Base):
    __tablename__ = "navigation_menus"
    __table_args__ = (
        Index(
            "uq_navigation_menus_key_live",
            "key",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    key: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)


class NavigationItem(WorkspaceRoot, Base):
    __tablename__ = "navigation_items"
    __table_args__ = (
        CheckConstraint(
            "(target_page_id IS NOT NULL) OR (external_url IS NOT NULL)",
            name="ck_navigation_items_target",
        ),
        Index("ix_navigation_items_menu", "menu_id"),
        Index("ix_navigation_items_parent", "parent_id"),
        Index("ix_navigation_items_page", "target_page_id"),
    )

    menu_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("navigation_menus.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("navigation_items.id", ondelete="CASCADE"), nullable=True
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    target_page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("pages.id", ondelete="SET NULL"), nullable=True
    )
    external_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Page(WorkspaceRoot, Base):
    __tablename__ = "pages"
    __table_args__ = (
        CheckConstraint(
            "template_key IN ('home','treatment-index','treatment-detail',"
            "'clinic-detail','article-index','article-detail','quiz','legal',"
            "'offers-index','generic')",
            name="ck_pages_template_key",
        ),
        Index("uq_pages_path_live", "path", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("uq_pages_route_key_live", "route_key", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    path: Mapped[str] = mapped_column(Text, nullable=False)
    route_key: Mapped[str] = mapped_column(Text, nullable=False)
    template_key: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    indexable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PageSection(WorkspaceRoot, Base):
    __tablename__ = "page_sections"
    __table_args__ = (
        CheckConstraint("jsonb_typeof(payload) = 'object'", name="ck_page_sections_payload_object"),
        Index("ix_page_sections_page", "page_id"),
    )

    page_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    block_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))


class PageSeo(WorkspaceRoot, Base):
    __tablename__ = "page_seo"
    __table_args__ = (
        Index("uq_page_seo_page_live", "page_id", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    page_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    canonical_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    # og_media_id FK to media_assets is added in Task 10; kept nullable for now.
    og_media_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_page_seo_og_media_id"), nullable=True)
    structured_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class SitePublication(Base):
    """Immutable canonical snapshot. No updated_at/version — publications never change."""

    __tablename__ = "site_publications"
    __table_args__ = (
        UniqueConstraint("version", name="uq_site_publications_version"),
        CheckConstraint("jsonb_typeof(snapshot) = 'object'", name="ck_site_publications_snapshot_object"),
        Index("ix_site_publications_published_at", "published_at"),
        Index("ix_site_publications_content_hash", "content_hash"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    version: Mapped[int] = mapped_column(BigInteger, nullable=False)
    workspace_version: Mapped[int] = mapped_column(BigInteger, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    content_hash: Mapped[str] = mapped_column(Text, nullable=False)
    activation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class HomepageService(WorkspaceRoot, Base):
    """A card in the homepage "Tratamente uzuale" services section."""
    __tablename__ = "homepage_services"
    __table_args__ = (Index("ix_homepage_services_position", "position"),)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(Text, nullable=True)  # short badge, e.g. "01"
    link: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class GalleryImage(WorkspaceRoot, Base):
    """An image in the homepage "Un spatiu clinic clar" clinic gallery carousel.

    Uses an uploaded media asset (`media_id`) when present, otherwise a static/external
    `image_url` (so seeded placeholder illustrations work without a media upload).
    """
    __tablename__ = "gallery_images"
    __table_args__ = (Index("ix_gallery_images_position", "position"),)

    media_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("media_assets.id", ondelete="SET NULL", name="fk_gallery_images_media_id"),
        nullable=True,
    )
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PreviewSession(Base, TimestampMixin):
    __tablename__ = "preview_sessions"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_preview_sessions_token_hash"),
        Index("ix_preview_sessions_expires_at", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
