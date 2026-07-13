"""Anonymous, consent-aware first-party analytics ingestion endpoint."""

from __future__ import annotations

from flask import request as flask_request

from src.analytics.schemas import AnalyticsEventInput
from src.analytics.service import collect_event
from src.api._helpers import _json, _validate, public_endpoint
from src.core.db import session_scope


@public_endpoint
def analytics_event_create(app, operation, request, **kwargs):
    payload = AnalyticsEventInput(
        **_validate(AnalyticsEventInput, flask_request.get_json(silent=True))
    )
    with session_scope() as session:
        result = collect_event(session, payload, flask_request)
    # Intentionally do not expose derived identity/network/location information.
    return _json({"accepted": result["accepted"]}, 202)
