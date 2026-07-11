"""Media service tests using a fake storage port (no real MinIO needed)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from src.core.errors import GoneError, ValidationError
from src.iam.capabilities import ROLE_ADMIN
from src.iam.principal import Principal
from src.media.image_processor import get_processor
from src.media.service import MediaService
from tests.media_helpers import FakeStorage, gif_bytes, png_bytes

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def _svc(session):
    return MediaService(session, ADMIN, storage=FakeStorage(), processor=get_processor())


def test_upload_public_image_creates_variants(db_session):
    out = _svc(db_session).upload_image(png_bytes(1600, 1200), filename="x.png", alt_text="a tooth")
    assert out["readiness"] == "ready"
    variant_names = {v["variant"] for v in out["variants"]}
    assert {"original", "thumbnail", "card", "hero"} <= variant_names
    assert out["sha256"]


def test_public_image_requires_alt_text(db_session):
    with pytest.raises(ValidationError):
        _svc(db_session).upload_image(png_bytes(), filename="x.png", alt_text="")


def test_unsupported_format_rejected(db_session):
    with pytest.raises(ValidationError):
        _svc(db_session).upload_image(gif_bytes(), filename="x.gif", alt_text="a")


def test_dedup_within_privacy_class(db_session):
    svc = _svc(db_session)
    data = png_bytes(500, 500, color=(1, 2, 3))
    a = svc.upload_image(data, filename="a.png", alt_text="a")
    b = svc.upload_image(data, filename="b.png", alt_text="a")
    assert a["id"] == b["id"]  # same bytes -> same asset


def test_case_image_consent_gate_and_revocation(db_session):
    svc = _svc(db_session)
    asset = svc.upload_image(png_bytes(400, 400), filename="c.png", alt_text=None, privacy_class="case_image")
    aid = asset["id"]
    # no consent yet -> delivery is gone
    with pytest.raises(GoneError):
        svc.read_variant(aid, "card")
    # attest -> deliverable
    svc.attest_consent(aid, scope="marketing", expires_at=datetime.now(timezone.utc) + timedelta(days=30))
    data, ct, etag, cache = svc.read_variant(aid, "card")
    assert data and cache == "no-store"
    # revoke -> gone again, and a delivery block exists
    svc.revoke_consent(aid, reason="patient request")
    with pytest.raises(GoneError):
        svc.read_variant(aid, "card")


def test_expired_consent_blocks_delivery(db_session):
    svc = _svc(db_session)
    asset = svc.upload_image(png_bytes(400, 400), filename="e.png", alt_text=None, privacy_class="case_image")
    svc.attest_consent(asset["id"], expires_at=datetime.now(timezone.utc) - timedelta(days=1))
    with pytest.raises(GoneError):
        svc.read_variant(asset["id"], "card")
