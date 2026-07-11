"""UTC clock + UUIDv7 helpers.

All timestamps are timezone-aware UTC. Externally visible IDs are UUIDv7 (time-
ordered) so listings sort naturally by creation without leaking a sequence.
"""
from __future__ import annotations

import os
import struct
import time
import uuid
from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def uuid7() -> uuid.UUID:
    """Generate a UUIDv7 (RFC 9562): 48-bit ms timestamp + random, version/variant set."""
    unix_ms = int(time.time() * 1000)
    ts = struct.pack(">Q", unix_ms)[2:]  # low 48 bits
    rand = os.urandom(10)
    raw = bytearray(ts + rand)
    raw[6] = (raw[6] & 0x0F) | 0x70  # version 7
    raw[8] = (raw[8] & 0x3F) | 0x80  # RFC 4122 variant
    return uuid.UUID(bytes=bytes(raw))
