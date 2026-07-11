"""Helpers for media tests: an in-memory storage fake and image byte factories."""
from __future__ import annotations

import io

from PIL import Image

from src.media.ports import StoredObject


class FakeStorage:
    def __init__(self):
        self.objects: dict[str, tuple[bytes, str]] = {}

    def put(self, object_key, data, content_type) -> StoredObject:
        self.objects[object_key] = (data, content_type)
        return StoredObject(object_key=object_key, byte_size=len(data))

    def get_stream(self, object_key):
        data, ct = self.objects[object_key]
        return io.BytesIO(data), len(data), ct

    def delete(self, object_key):
        self.objects.pop(object_key, None)

    def bucket_ok(self) -> bool:
        return True


def png_bytes(w=1200, h=800, color=(200, 30, 30)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color).save(buf, "PNG")
    return buf.getvalue()


def jpeg_bytes(w=1000, h=1000) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (10, 120, 200)).save(buf, "JPEG")
    return buf.getvalue()


def gif_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("P", (10, 10)).save(buf, "GIF")
    return buf.getvalue()
