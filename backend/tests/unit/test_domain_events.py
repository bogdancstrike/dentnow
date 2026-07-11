"""Domain-event envelope + transactional outbox insertion."""
from __future__ import annotations

import pytest
from sqlalchemy import select

from src.integrations.events import DomainEvent, is_known_event
from src.integrations.models import IntegrationOutbox
from src.integrations.outbox import enqueue_event


def test_event_requires_versioned_type():
    with pytest.raises(ValueError):
        DomainEvent(event_type="clinic.updated", aggregate_type="clinic", aggregate_id="x")
    ok = DomainEvent(event_type="clinic.updated.v1", aggregate_type="clinic", aggregate_id="x")
    assert ok.schema_version == 1


def test_known_events():
    assert is_known_event("site.publication.activated.v1")
    assert not is_known_event("something.random.v9")


def test_enqueue_inserts_outbox_row(db_session):
    enqueue_event(
        db_session, event_type="offer.published.v1", aggregate_type="offer",
        aggregate_id="abc", payload={"slug": "promo"}, correlation_id="cid-1",
    )
    row = db_session.scalar(
        select(IntegrationOutbox).where(IntegrationOutbox.aggregate_id == "abc")
    )
    assert row is not None
    assert row.event_type == "offer.published.v1"
    assert row.published_at is None  # pending
    assert row.event_id is not None  # unique idempotency id
