"""Outbox is written in the same transaction as the business change (DB-backed)."""
from __future__ import annotations

import uuid

from src.integrations.models import IntegrationOutbox
from src.site.models import SiteLink


def test_outbox_row_commits_with_site_mutation(db_session):
    link = SiteLink(kind="phone", label="Primary", value="+40720509802", display_value="0720 509 802")
    db_session.add(link)
    db_session.flush()  # assigns link.id (UUIDv7)

    event = IntegrationOutbox(
        event_id=uuid.uuid4(),
        event_type="clinic.updated.v1",
        aggregate_type="site_link",
        aggregate_id=str(link.id),
        payload={"kind": "phone"},
        correlation_id="test-correlation",
    )
    db_session.add(event)
    db_session.flush()

    # Both are visible within the same transaction.
    assert db_session.get(SiteLink, link.id) is not None
    stored = db_session.get(IntegrationOutbox, event.id)
    assert stored is not None
    assert stored.published_at is None  # pending
    assert stored.attempts == 0


def test_uuidv7_primary_key_is_version_7(db_session):
    link = SiteLink(kind="email", label="Office", value="office@dentnow.ro")
    db_session.add(link)
    db_session.flush()
    assert link.id.version == 7
