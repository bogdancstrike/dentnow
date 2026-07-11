"""Media metadata, variants, links, consent, delivery blocks (schema slice 6)."""
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
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.clock import uuid7
from src.core.db import Base
from src.core.mixins import WorkspaceRoot

MEDIA_KINDS = ("image", "document")
PRIVACY_CLASSES = ("public", "case_image")
READINESS = ("uploading", "ready", "quarantined", "failed")


class MediaAsset(WorkspaceRoot, Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        CheckConstraint("media_kind IN ('image','document')", name="ck_media_kind"),
        CheckConstraint("privacy_class IN ('public','case_image')", name="ck_media_privacy"),
        CheckConstraint("readiness IN ('uploading','ready','quarantined','failed')", name="ck_media_readiness"),
        Index("ix_media_assets_checksum", "sha256"),
        Index("ix_media_assets_privacy", "privacy_class"),
    )
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    media_kind: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str | None] = mapped_column(Text, nullable=True)
    byte_size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    focal_x: Mapped[float | None] = mapped_column(nullable=True)
    focal_y: Mapped[float | None] = mapped_column(nullable=True)
    rights_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    privacy_class: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'public'"))
    readiness: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'uploading'"))


class MediaVariant(Base):
    __tablename__ = "media_variants"
    __table_args__ = (
        UniqueConstraint("asset_id", "variant", name="uq_media_variants_asset_variant"),
        Index("ix_media_variants_asset", "asset_id"),
    )
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False
    )
    variant: Mapped[str] = mapped_column(Text, nullable=False)  # original/thumbnail/card/hero
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    byte_size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)


class ContentMediaLink(Base):
    __tablename__ = "content_media_links"
    __table_args__ = (
        Index("ix_content_media_links_asset", "asset_id"),
        Index("ix_content_media_links_entity", "entity_type", "entity_id"),
    )
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[str] = mapped_column(Text, nullable=False)
    usage: Mapped[str] = mapped_column(Text, nullable=False)  # cover/before/after/portrait/...


class PublicationMedia(Base):
    """Media referenced by a publication; prevents premature deletion."""

    __tablename__ = "publication_media"
    # Composite primary key (publication_id, asset_id) already enforces uniqueness.
    __table_args__ = (Index("ix_publication_media_asset", "asset_id"),)
    publication_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("site_publications.id", ondelete="CASCADE"), primary_key=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="RESTRICT"), primary_key=True
    )


class MediaConsent(Base):
    """Non-identifying case-image publication attestation. NO patient identity or
    evidence-document bytes — only an opaque reference to the clinic's own records.
    """

    __tablename__ = "media_consents"
    __table_args__ = (Index("ix_media_consents_asset", "asset_id"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False
    )
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_reference: Mapped[str | None] = mapped_column(Text, nullable=True)  # opaque, external
    obtained_at = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class MediaDeliveryBlock(Base):
    """Mutable deny/tombstone checked before every consent-bound media delivery and
    publication activation. Revocation creates this block before any async purge.
    """

    __tablename__ = "media_delivery_blocks"
    __table_args__ = (Index("ix_media_delivery_blocks_asset", "asset_id"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
