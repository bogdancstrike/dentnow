"""Shared column mixins for workspace roots.

Every mutable root carries an opaque UUIDv7 id, an integer ``version`` for optimistic
concurrency, audit timestamps/actors, and ``deleted_at`` for recoverable deletion.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .clock import uuid7


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class WorkspaceRoot(TimestampMixin):
    """UUIDv7 id + optimistic version + audit actors + soft delete."""

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    version: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    created_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
