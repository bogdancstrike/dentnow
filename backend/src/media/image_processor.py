"""Pillow image-processing adapter: MIME sniff, decompression-bomb guard, EXIF
strip via decode+re-encode, and bounded variants.
"""
from __future__ import annotations

import io

from PIL import Image

from src.media.ports import ImageVariantSpec, ProcessedImage

# Decompression-bomb guard: refuse images whose pixel count is implausibly large.
MAX_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

_FORMAT_MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
_MIME_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class ImageError(ValueError):
    pass


class PillowProcessor:
    def _open(self, data: bytes) -> Image.Image:
        try:
            img = Image.open(io.BytesIO(data))
            img.verify()  # cheap integrity check
        except Exception as exc:
            raise ImageError(f"not a decodable image: {exc}") from exc
        # verify() leaves the image unusable; reopen for real work.
        img = Image.open(io.BytesIO(data))
        if img.width * img.height > MAX_PIXELS:
            raise ImageError("image exceeds pixel limit (decompression-bomb guard)")
        if (img.format or "").upper() not in _FORMAT_MIME:
            raise ImageError(f"unsupported image format: {img.format}")
        return img

    def identify(self, data: bytes) -> tuple[str, int, int]:
        img = self._open(data)
        return _FORMAT_MIME[img.format.upper()], img.width, img.height

    def _encode(self, img: Image.Image, target_format: str) -> ProcessedImage:
        # Re-encode from pixel data only -> drops EXIF and any active metadata.
        buf = io.BytesIO()
        clean = Image.new(img.mode if img.mode in ("RGB", "RGBA", "L") else "RGB", img.size)
        clean.paste(img.convert(clean.mode))
        save_kwargs = {"format": target_format}
        if target_format == "JPEG":
            clean = clean.convert("RGB")
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        clean.save(buf, **save_kwargs)
        mime = _FORMAT_MIME[target_format]
        return ProcessedImage(
            data=buf.getvalue(), width=clean.width, height=clean.height,
            mime_type=mime, ext=_MIME_EXT[mime],
        )

    def reencode(self, data: bytes) -> ProcessedImage:
        img = self._open(data)
        fmt = img.format.upper()
        target = "JPEG" if fmt == "JPEG" else ("PNG" if fmt == "PNG" else "WEBP")
        return self._encode(img, target)

    def make_variant(self, data: bytes, spec: ImageVariantSpec) -> ProcessedImage:
        img = self._open(data)
        img = img.copy()
        img.thumbnail((spec.max_width, spec.max_height))
        fmt = (img.format or "JPEG").upper()
        target = "JPEG" if fmt == "JPEG" else ("PNG" if fmt == "PNG" else "WEBP")
        return self._encode(img, target)


_processor: PillowProcessor | None = None


def get_processor() -> PillowProcessor:
    global _processor
    if _processor is None:
        _processor = PillowProcessor()
    return _processor
