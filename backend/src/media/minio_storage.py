"""MinIO/S3 object-storage adapter (boto3). No object URL or credential ever leaks
into a public serializer — bytes are proxied through the API.
"""
from __future__ import annotations

import io
from typing import BinaryIO

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import ClientError

from src.config import Config
from src.media.ports import StoredObject


class MinioStorage:
    def __init__(self):
        self._client = boto3.client(
            "s3",
            endpoint_url=Config.S3_ENDPOINT_URL,
            aws_access_key_id=Config.S3_ACCESS_KEY,
            aws_secret_access_key=Config.S3_SECRET_KEY,
            region_name=Config.S3_REGION,
            config=BotoConfig(
                s3={"addressing_style": "path" if Config.S3_USE_PATH_STYLE else "auto"},
                signature_version="s3v4",
                connect_timeout=5,
                read_timeout=30,
                retries={"max_attempts": 3},
            ),
        )
        self._bucket = Config.S3_BUCKET

    def put(self, object_key: str, data: bytes, content_type: str) -> StoredObject:
        self._client.put_object(
            Bucket=self._bucket, Key=object_key, Body=data, ContentType=content_type
        )
        return StoredObject(object_key=object_key, byte_size=len(data))

    def get_stream(self, object_key: str) -> tuple[BinaryIO, int, str]:
        obj = self._client.get_object(Bucket=self._bucket, Key=object_key)
        body = io.BytesIO(obj["Body"].read())
        return body, obj["ContentLength"], obj.get("ContentType", "application/octet-stream")

    def delete(self, object_key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=object_key)

    def bucket_ok(self) -> bool:
        try:
            self._client.head_bucket(Bucket=self._bucket)
            return True
        except ClientError:
            return False


_storage: MinioStorage | None = None


def get_storage() -> MinioStorage:
    global _storage
    if _storage is None:
        _storage = MinioStorage()
    return _storage
