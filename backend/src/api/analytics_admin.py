"""Permission-protected aggregate analytics endpoints."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from flask import make_response
from flask import request as flask_request

from src.analytics.service import analytics_overview, overview_csv
from src.api._helpers import _json
from src.core.db import session_scope
from src.core.errors import ValidationError
from src.iam.capabilities import CAP_ANALYTICS_READ
from src.iam.decorators import require_capability


def _date_range() -> tuple[date, date]:
    today = datetime.now(ZoneInfo("Europe/Bucharest")).date()
    try:
        date_to = date.fromisoformat(flask_request.args.get("to", today.isoformat()))
        date_from = date.fromisoformat(
            flask_request.args.get("from", (date_to - timedelta(days=29)).isoformat())
        )
    except ValueError as exc:
        raise ValidationError("invalid analytics date range") from exc
    if date_from > date_to:
        raise ValidationError("analytics range start must not exceed end")
    if (date_to - date_from).days > 366:
        raise ValidationError("analytics range cannot exceed 367 days")
    return date_from, date_to


@require_capability(CAP_ANALYTICS_READ)
def analytics_overview_get(app, operation, request, principal=None, **kwargs):
    date_from, date_to = _date_range()
    with session_scope() as session:
        return _json(analytics_overview(session, date_from, date_to), 200)


@require_capability(CAP_ANALYTICS_READ)
def analytics_export_get(app, operation, request, principal=None, **kwargs):
    date_from, date_to = _date_range()
    with session_scope() as session:
        content = overview_csv(analytics_overview(session, date_from, date_to))
    response = make_response(content, 200)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="dentnow-analytics-{date_from.isoformat()}-{date_to.isoformat()}.csv"'
    )
    response.headers["Cache-Control"] = "no-store"
    return response
