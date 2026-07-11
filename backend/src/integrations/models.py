"""Transactional outbox + external-integration binding tables.

Domain events are inserted into ``integration_outbox`` in the same transaction as the
business change. A future relay delivers them; qf ETL stays disabled. External IDs
live in ``integration_bindings`` and never in core entity primary keys.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column


from src.core.db import Base


class IntegrationOutbox(Base):
    __tablename__ = "integration_outbox"
    __table_args__ = (
        UniqueConstraint("event_id", name="uq_integration_outbox_event_id"),
        Index(
            "ix_integration_outbox_pending",
            "available_at",
            postgresql_where=text("published_at IS NULL"),
        ),
        Index("ix_integration_outbox_aggregate", "aggregate_type", "aggregate_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    event_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    aggregate_type: Mapped[str] = mapped_column(Text, nullable=False)
    aggregate_id: Mapped[str] = mapped_column(Text, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class IntegrationBinding(Base):
    __tablename__ = "integration_bindings"
    __table_args__ = (
        UniqueConstraint(
            "provider", "binding_type", "external_id",
            name="uq_integration_bindings_provider_type_external",
        ),
        Index("ix_integration_bindings_entity", "entity_type", "entity_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    binding_type: Mapped[str] = mapped_column(Text, nullable=False)
    external_id: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class IntegrationDelivery(Base):
    """Optional delivery attempt/result ledger — used only when a relay is enabled."""

    __tablename__ = "integration_deliveries"
    __table_args__ = (Index("ix_integration_deliveries_outbox", "outbox_id"),)

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    outbox_id: Mapped[int] = mapped_column(
        ForeignKey("integration_outbox.id", ondelete="CASCADE"), nullable=False
    )
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
