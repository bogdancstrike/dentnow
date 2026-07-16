from __future__ import annotations

from unittest.mock import MagicMock

from flask import Flask, request

from src.analytics.models import AnalyticsEvent
from src.analytics.schemas import AnalyticsEventInput
from src.analytics.service import collect_event, overview_csv
from src.config import Config


def test_collect_event_uses_browser_coordinates_and_request_identity(monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_REQUIRE_CONSENT", True)
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "test-key")
    session = MagicMock()
    session.scalar.return_value = 0
    app = Flask(__name__)
    payload = AnalyticsEventInput(
        event_type="page_view",
        path="/",
        consent_granted=True,
        latitude=44.4268,
        longitude=26.1025,
        geo_accuracy_m=20,
    )
    with app.test_request_context(
        "/",
        headers={"User-Agent": "Mozilla/5.0 Firefox/126"},
        environ_base={"REMOTE_ADDR": "198.51.100.8"},
    ):
        assert collect_event(session, payload, request)["accepted"] is True
    event = session.add.call_args.args[0]
    assert isinstance(event, AnalyticsEvent)
    assert event.client_ip == "198.51.100.8"
    assert event.latitude == 44.4268
    assert event.geo_accuracy_m == 20


def test_collect_event_rate_limit_is_non_mutating(monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_REQUIRE_CONSENT", False)
    monkeypatch.setattr(Config, "ANALYTICS_RATE_LIMIT_PER_MINUTE", 2)
    session = MagicMock()
    session.scalar.return_value = 2
    app = Flask(__name__)
    with app.test_request_context("/", headers={"User-Agent": "Chrome/126"}):
        result = collect_event(
            session, AnalyticsEventInput(event_type="page_view", path="/"), request
        )
    assert result == {"accepted": False, "reason": "rate_limited"}
    session.add.assert_not_called()


def test_event_without_location_consent_keeps_request_ip_and_user_agent(monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_REQUIRE_CONSENT", True)
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "test-key")
    monkeypatch.setattr(Config, "ANALYTICS_TRUSTED_PROXY_CIDRS", ("127.0.0.1/32",))
    session = MagicMock()
    session.scalar.return_value = 0
    app = Flask(__name__)
    headers = {
        "User-Agent": "Mozilla/5.0 (Android Mobile) Chrome/126",
        "CF-IPCountry": "RO",
        "CF-Region": "București",
        "CF-IPCity": "București",
        "CF-IPLatitude": "44.4268",
        "CF-IPLongitude": "26.1025",
    }
    with app.test_request_context(
        "/", headers=headers, environ_base={"REMOTE_ADDR": "127.0.0.1"}
    ):
        result = collect_event(
            session,
            AnalyticsEventInput(event_type="page_view", path="/"),
            request,
        )

    assert result == {"accepted": True}
    event = session.add.call_args.args[0]
    assert event.client_ip == "127.0.0.1"
    assert "Android Mobile" in event.user_agent
    assert event.consent_granted is False
    assert event.device_family == "mobile"
    assert event.country_code == "RO"
    assert float(event.latitude) == 44.4268


def test_csv_export_contains_trend_and_dimensions():
    overview = {
        "trend": [
            {
                "date": "2026-07-13",
                "visitors": 2,
                "sessions": 3,
                "page_views": 5,
                "cta_clicks": 1,
            }
        ],
        **{
            key: []
            for key in (
                "top_pages",
                "top_articles",
                "top_clicks",
                "top_treatments",
                "top_offers",
                "devices",
                "browsers",
                "referrers",
                "internet_providers",
                "timezones",
                "ip_addresses",
                "user_agents",
            )
        },
    }
    content = overview_csv(overview)
    assert "2026-07-13,2,3,5,1" in content
    assert "vizitatori_unici" in content
