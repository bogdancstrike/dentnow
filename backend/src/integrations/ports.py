"""Outbound/inbound integration ports (anti-corruption boundary).

Concrete adapters (HTTP/webhook/Kafka/vendor SDK) implement these later. Domain code
in site/clinics/catalog/editorial NEVER imports a vendor SDK or these adapters — use
cases only emit outbox events. Inbound requests terminate at a versioned adapter,
verify signatures, enforce idempotency keys, and translate into owning-context
commands; external IDs live in ``integration_bindings`` only.
"""
from __future__ import annotations

from typing import Protocol

from src.integrations.events import DomainEvent


class OutboundRelayPort(Protocol):
    def deliver(self, event: DomainEvent, *, idempotency_key: str) -> None:
        """Deliver one event with at-least-once semantics and retry/dead-letter."""
        ...


class InboundAdapterPort(Protocol):
    def verify_signature(self, raw_body: bytes, headers: dict) -> bool: ...
    def idempotency_key(self, headers: dict) -> str: ...
    def to_command(self, raw_body: bytes) -> object:
        """Translate the external vendor model into an owning-context command."""
        ...
