"""Transactional-outbox enqueue helper.

Domain events are inserted in the SAME transaction as the business change. A future
relay (Task 12+) delivers them; qf ETL stays disabled. Event types carry a ``.v1``
suffix and a minimal non-PII payload.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from src.integrations.models import IntegrationOutbox


def enqueue_event(
    session: Session,
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id: Any,
    payload: dict[str, Any] | None = None,
    correlation_id: str | None = None,
    schema_version: int = 1,
) -> None:
    session.add(
        IntegrationOutbox(
            event_id=uuid.uuid4(),
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=str(aggregate_id),
            payload=payload or {},
            correlation_id=correlation_id,
            schema_version=schema_version,
        )
    )
