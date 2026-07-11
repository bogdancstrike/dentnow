"""Versioned domain-event envelope + the current event catalog.

Events are minimal and non-PII. They are inserted into ``integration_outbox`` in the
same transaction as the business change (see ``outbox.enqueue_event``). A future relay
delivers them over HTTP/webhook/Kafka/vendor SDK with idempotency and retries; qf ETL
stays disabled until an actual asynchronous use case justifies enabling it.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# Current event types (all carry a `.v1` suffix). Extend, never repurpose.
EVENT_TYPES = frozenset({
    "site.updated.v1",
    "site.publication.activated.v1",
    "site.workspace.restored.v1",
    "clinic.created.v1",
    "clinic.updated.v1",
    "clinic.deleted.v1",
    "treatment.created.v1",
    "treatment.updated.v1",
    "offer.created.v1",
    "offer.updated.v1",
    "offer.published.v1",
    "media.uploaded.v1",
    "media.consent.revoked.v1",
    "case.consent.updated.v1",
})


@dataclass(frozen=True)
class DomainEvent:
    event_type: str
    aggregate_type: str
    aggregate_id: str
    payload: dict = field(default_factory=dict)
    schema_version: int = 1

    def __post_init__(self):
        if not self.event_type.endswith(".v1"):
            raise ValueError("event_type must be versioned with a .v1 suffix")


def is_known_event(event_type: str) -> bool:
    return event_type in EVENT_TYPES
