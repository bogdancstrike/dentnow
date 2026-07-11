"""Real-MinIO media round trip (skips unless S3 credentials are configured)."""
from __future__ import annotations

import os

import pytest

from src.iam.capabilities import ROLE_ADMIN
from src.iam.principal import Principal
from tests.media_helpers import png_bytes

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


# Opt-in: set RUN_MINIO_TESTS=1 (CI/compose) with S3 creds to exercise real MinIO.
pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_MINIO_TESTS") != "1",
    reason="RUN_MINIO_TESTS != 1 (real-MinIO test opt-in)",
)


def test_upload_and_read_back_from_minio(db_session):
    from src.media.image_processor import get_processor
    from src.media.minio_storage import MinioStorage
    from src.media.service import MediaService

    storage = MinioStorage()
    if not storage.bucket_ok():
        pytest.skip("dentnow-media bucket not reachable")

    svc = MediaService(db_session, ADMIN, storage=storage, processor=get_processor())
    asset = svc.upload_image(png_bytes(600, 400), filename="real.png", alt_text="real image")
    data, ct, etag, cache = svc.read_variant(asset["id"], "card")
    assert data and ct.startswith("image/")
    assert "immutable" in cache  # public media is immutably cached
