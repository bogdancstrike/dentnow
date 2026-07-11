"""Media application service: upload, variants, dedup, delivery, consent, blocks."""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from src.audit.service import write_audit
from src.core.clock import utcnow
from src.core.correlation import get_correlation_id
from src.core.errors import ConflictError, GoneError, NotFoundError, ValidationError
from src.integrations.outbox import enqueue_event
from src.media.image_processor import ImageError, get_processor
from src.media.minio_storage import get_storage
from src.media.models import (
    MediaAsset,
    MediaConsent,
    MediaDeliveryBlock,
    MediaVariant,
    PublicationMedia,
)
from src.media.ports import ImageVariantSpec
from src.media.serializers import serialize_asset, serialize_consent
from src.site.workspace import bump_workspace_version

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
VARIANT_SPECS = [
    ImageVariantSpec("thumbnail", 400, 400),
    ImageVariantSpec("card", 800, 600),
    ImageVariantSpec("hero", 1600, 900),
]


def _object_key(asset_id: uuid.UUID, variant: str, ext: str) -> str:
    return f"site/{asset_id}/{variant}.{ext}"


def _variants(assets_session, asset_id):
    return assets_session.scalars(
        select(MediaVariant).where(MediaVariant.asset_id == asset_id)
    ).all()


class MediaService:
    def __init__(self, session, principal, *, storage=None, processor=None):
        self.session = session
        self.principal = principal
        self.storage = storage or get_storage()
        self.processor = processor or get_processor()

    # ── upload ───────────────────────────────────────────────────────────────
    def upload_image(self, data: bytes, *, filename: str | None, alt_text: str | None,
                     privacy_class: str = "public", rights_note: str | None = None) -> dict:
        if len(data) == 0:
            raise ValidationError("empty upload")
        if len(data) > MAX_UPLOAD_BYTES:
            raise ValidationError("file exceeds maximum size")
        if privacy_class not in ("public", "case_image"):
            raise ValidationError("invalid privacy class")
        # Meaningful public images require alt text.
        if privacy_class == "public" and not (alt_text and alt_text.strip()):
            raise ValidationError("alt text is required for public images", details={"field": "alt_text"})

        try:
            mime, _w, _h = self.processor.identify(data)
        except ImageError as exc:
            raise ValidationError(str(exc)) from exc
        if mime not in IMAGE_MIMES:
            raise ValidationError("unsupported image type (SVG/HTML not accepted)")

        # Re-encode original (strips EXIF/active metadata) and hash the clean bytes.
        original = self.processor.reencode(data)
        sha = hashlib.sha256(original.data).hexdigest()

        # Dedup within the same privacy class.
        existing = self.session.scalar(
            select(MediaAsset).where(
                MediaAsset.sha256 == sha,
                MediaAsset.privacy_class == privacy_class,
                MediaAsset.deleted_at.is_(None),
            )
        )
        if existing is not None:
            return serialize_asset(existing, _variants(self.session, existing.id))

        asset_id = uuid.uuid4()
        cid = get_correlation_id()
        uploaded_keys: list[str] = []
        try:
            orig_key = _object_key(asset_id, "original", original.ext)
            self.storage.put(orig_key, original.data, original.mime_type)
            uploaded_keys.append(orig_key)

            asset = MediaAsset(
                id=asset_id, object_key=orig_key, media_kind="image", mime_type=original.mime_type,
                original_filename=filename, byte_size=len(original.data), width=original.width,
                height=original.height, sha256=sha, alt_text=alt_text, rights_note=rights_note,
                privacy_class=privacy_class, readiness="ready",
                created_by=self.principal.subject, updated_by=self.principal.subject,
            )
            self.session.add(asset)
            self.session.flush()
            self.session.add(MediaVariant(
                asset_id=asset_id, variant="original", object_key=orig_key,
                width=original.width, height=original.height, byte_size=len(original.data),
            ))

            for spec in VARIANT_SPECS:
                v = self.processor.make_variant(original.data, spec)
                vkey = _object_key(asset_id, spec.name, v.ext)
                self.storage.put(vkey, v.data, v.mime_type)
                uploaded_keys.append(vkey)
                self.session.add(MediaVariant(
                    asset_id=asset_id, variant=spec.name, object_key=vkey,
                    width=v.width, height=v.height, byte_size=len(v.data),
                ))
            self.session.flush()
        except Exception:
            # Best-effort cleanup of any objects written before the failure.
            for key in uploaded_keys:
                try:
                    self.storage.delete(key)
                except Exception:
                    pass
            raise

        write_audit(self.session, action="media.upload", entity_type="media_asset",
                    entity_id=asset_id, principal=self.principal,
                    after={"privacy_class": privacy_class, "mime": original.mime_type}, correlation_id=cid)
        enqueue_event(self.session, event_type="media.uploaded.v1", aggregate_type="media_asset",
                      aggregate_id=asset_id, payload={"privacy_class": privacy_class}, correlation_id=cid)
        bump_workspace_version(self.session)
        return serialize_asset(asset, _variants(self.session, asset_id))

    # ── metadata ─────────────────────────────────────────────────────────────
    def get(self, asset_id) -> dict:
        asset = self._live(asset_id)
        return serialize_asset(asset, _variants(self.session, asset.id))

    def update_metadata(self, asset_id, data: dict) -> dict:
        asset = self._live(asset_id)
        for key in ("alt_text", "caption", "rights_note", "focal_x", "focal_y"):
            if key in data:
                setattr(asset, key, data[key])
        asset.version += 1
        asset.updated_by = self.principal.subject
        self.session.flush()
        return serialize_asset(asset, _variants(self.session, asset.id))

    def delete(self, asset_id) -> None:
        asset = self._live(asset_id)
        # Refuse if referenced by a retained publication.
        ref = self.session.scalar(
            select(PublicationMedia.asset_id).where(PublicationMedia.asset_id == asset.id).limit(1)
        )
        if ref is not None:
            raise ConflictError("asset is referenced by a publication")
        asset.deleted_at = utcnow()
        asset.version += 1
        self.session.flush()

    def _live(self, asset_id) -> MediaAsset:
        asset = self.session.get(MediaAsset, uuid.UUID(str(asset_id)))
        if asset is None or asset.deleted_at is not None:
            raise NotFoundError("media asset not found")
        return asset

    # ── delivery ─────────────────────────────────────────────────────────────
    def read_variant(self, asset_id, variant: str, *, require_publication: bool = False):
        """Return (bytes, content_type, etag, cache_control). Raises Gone on revocation."""
        asset = self._live(asset_id)
        if asset.readiness != "ready":
            raise NotFoundError("media not available")
        if require_publication:
            ref = self.session.scalar(
                select(PublicationMedia.asset_id).where(PublicationMedia.asset_id == asset.id).limit(1)
            )
            if ref is None:
                raise NotFoundError("media not published")

        consent_bound = asset.privacy_class == "case_image"
        if consent_bound:
            self._assert_deliverable(asset)

        row = self.session.scalar(
            select(MediaVariant).where(MediaVariant.asset_id == asset.id, MediaVariant.variant == variant)
        )
        if row is None:
            raise NotFoundError("variant not found")
        stream, _size, content_type = self.storage.get_stream(row.object_key)
        etag = f'"{asset.sha256}:{variant}"'
        cache = "no-store" if consent_bound else "public, max-age=31536000, immutable"
        return stream.read(), content_type, etag, cache

    def _assert_deliverable(self, asset: MediaAsset) -> None:
        block = self.session.scalar(
            select(MediaDeliveryBlock.id).where(MediaDeliveryBlock.asset_id == asset.id).limit(1)
        )
        if block is not None:
            raise GoneError("media delivery is blocked")
        consent = self.session.scalar(
            select(MediaConsent).where(MediaConsent.asset_id == asset.id).order_by(MediaConsent.created_at.desc()).limit(1)
        )
        now = datetime.now(timezone.utc)
        if consent is None or consent.revoked_at is not None:
            raise GoneError("no current consent for this media")
        if consent.expires_at is not None and consent.expires_at < now:
            raise GoneError("consent for this media has expired")

    # ── consent + blocks ─────────────────────────────────────────────────────
    def attest_consent(self, asset_id, *, scope=None, evidence_reference=None, expires_at=None) -> dict:
        asset = self._live(asset_id)
        cid = get_correlation_id()
        consent = MediaConsent(
            asset_id=asset.id, scope=scope, reviewer=self.principal.subject,
            evidence_reference=evidence_reference, obtained_at=utcnow(), expires_at=expires_at,
        )
        self.session.add(consent)
        # Clear any prior delivery block for this asset (fresh attestation).
        for b in self.session.scalars(select(MediaDeliveryBlock).where(MediaDeliveryBlock.asset_id == asset.id)).all():
            self.session.delete(b)
        self.session.flush()
        write_audit(self.session, action="media.consent.attest", entity_type="media_asset",
                    entity_id=asset.id, principal=self.principal, after={"scope": scope}, correlation_id=cid)
        return serialize_consent(consent)

    def revoke_consent(self, asset_id, *, reason=None) -> None:
        asset = self._live(asset_id)
        cid = get_correlation_id()
        now = utcnow()
        for consent in self.session.scalars(
            select(MediaConsent).where(MediaConsent.asset_id == asset.id, MediaConsent.revoked_at.is_(None))
        ).all():
            consent.revoked_at = now
        # Mutable delivery block is created BEFORE any async purge (defense first).
        self.session.add(MediaDeliveryBlock(asset_id=asset.id, reason=reason, created_by=self.principal.subject))
        self.session.flush()
        write_audit(self.session, action="media.consent.revoke", entity_type="media_asset",
                    entity_id=asset.id, principal=self.principal, before={"reason": reason}, correlation_id=cid)
        enqueue_event(self.session, event_type="media.consent.revoked.v1", aggregate_type="media_asset",
                      aggregate_id=asset.id, payload={}, correlation_id=cid)


def minio_bucket_probe() -> None:
    """Readiness probe: the required bucket must be reachable."""
    if not get_storage().bucket_ok():
        raise RuntimeError("dentnow-media bucket unavailable")
