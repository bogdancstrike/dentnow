"""Application-owned ports. Domain/application code depends on these, never on boto3
or Pillow directly (adapters live in minio_storage.py and image_processor.py).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import BinaryIO, Protocol


@dataclass(frozen=True)
class StoredObject:
    object_key: str
    byte_size: int


@dataclass(frozen=True)
class ProcessedImage:
    data: bytes
    width: int
    height: int
    mime_type: str
    ext: str


@dataclass(frozen=True)
class ImageVariantSpec:
    name: str
    max_width: int
    max_height: int


class ObjectStoragePort(Protocol):
    def put(self, object_key: str, data: bytes, content_type: str) -> StoredObject: ...
    def get_stream(self, object_key: str) -> tuple[BinaryIO, int, str]: ...
    def delete(self, object_key: str) -> None: ...
    def bucket_ok(self) -> bool: ...


class ImageProcessorPort(Protocol):
    def identify(self, data: bytes) -> tuple[str, int, int]:
        """Return (mime_type, width, height); raise on non-image / decompression bomb."""
        ...

    def reencode(self, data: bytes) -> ProcessedImage:
        """Decode and re-encode to strip EXIF/active metadata."""
        ...

    def make_variant(self, data: bytes, spec: ImageVariantSpec) -> ProcessedImage: ...
