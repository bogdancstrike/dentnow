"""Pillow image-processor adapter tests."""
from __future__ import annotations

import pytest

from src.media.image_processor import ImageError, get_processor
from src.media.ports import ImageVariantSpec
from tests.media_helpers import gif_bytes, jpeg_bytes, png_bytes

P = get_processor()


def test_identify_png_and_jpeg():
    assert P.identify(png_bytes(300, 200))[0] == "image/png"
    assert P.identify(jpeg_bytes(300, 200))[0] == "image/jpeg"


def test_reencode_produces_decodable_image():
    out = P.reencode(png_bytes(300, 200))
    assert out.mime_type == "image/png"
    # output re-identifies cleanly (no residual metadata breaks decode)
    assert P.identify(out.data)[1:] == (300, 200)


def test_make_variant_downsizes_within_bounds():
    out = P.make_variant(png_bytes(1600, 1200), ImageVariantSpec("thumbnail", 400, 400))
    assert out.width <= 400 and out.height <= 400


def test_unsupported_format_rejected():
    with pytest.raises(ImageError):
        P.identify(gif_bytes())


def test_non_image_rejected():
    with pytest.raises(ImageError):
        P.identify(b"this is not an image")
