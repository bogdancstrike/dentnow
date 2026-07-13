from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

import pytest
import requests
from flask import Flask, request
from pydantic import ValidationError as PydanticValidationError

from src.analytics.privacy import (
    classify_user_agent,
    derive_identity,
    referrer_host,
    tracking_suppression_reason,
    _reset_geoip_state_for_tests,
)
from src.analytics.schemas import AnalyticsEventInput
from src.config import Config


@pytest.fixture()
def app():
    return Flask(__name__)


@pytest.fixture(autouse=True)
def reset_geoip_state():
    _reset_geoip_state_for_tests()
    yield
    _reset_geoip_state_for_tests()


def test_payload_rejects_client_identity_claims_and_unbounded_paths():
    with pytest.raises(PydanticValidationError):
        AnalyticsEventInput(event_type="page_view", path="/", ip="1.2.3.4")
    with pytest.raises(PydanticValidationError):
        AnalyticsEventInput(event_type="page_view", path="/?email=patient@example.com")
    with pytest.raises(PydanticValidationError):
        AnalyticsEventInput(event_type="page_view", path="/", latitude=44.4)


def test_browser_coordinates_are_strictly_bounded():
    payload = AnalyticsEventInput(
        event_type="clinic_view",
        path="/locatii/dristor",
        latitude=44.4268,
        longitude=26.1025,
        geo_accuracy_m=12,
    )
    assert payload.geo_accuracy_m == 12
    with pytest.raises(PydanticValidationError):
        AnalyticsEventInput(event_type="page_view", path="/", latitude=95, longitude=26)


def test_identity_stores_request_ip_ua_and_trusted_geo(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_TRUSTED_PROXY_CIDRS", ("127.0.0.1/32",))
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone) AppleWebKit Safari/604.1",
        "X-Forwarded-For": "203.0.113.42, 10.0.0.1",
        "CF-IPCountry": "RO",
        "CF-Region": "București",
        "CF-IPCity": "București",
        "CF-IPLatitude": "44.4268",
        "CF-IPLongitude": "26.1025",
    }
    with app.test_request_context(
        "/", headers=headers, environ_base={"REMOTE_ADDR": "127.0.0.1"}
    ):
        identity = derive_identity(request, datetime(2026, 7, 13, tzinfo=timezone.utc))
    assert identity.client_ip == "203.0.113.42"
    assert "iPhone" in identity.user_agent
    assert identity.device_family == "mobile"
    assert identity.browser_family == "Safari"
    assert identity.country_code == "RO"
    assert float(identity.latitude) == pytest.approx(44.4268)
    assert len(identity.visitor_key) == len(identity.session_key) == 32


def test_untrusted_peer_cannot_spoof_forwarded_ip(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_TRUSTED_PROXY_CIDRS", ("127.0.0.1/32",))
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    with app.test_request_context(
        "/",
        headers={"User-Agent": "Chrome/126", "X-Forwarded-For": "8.8.8.8"},
        environ_base={"REMOTE_ADDR": "192.0.2.7"},
    ):
        identity = derive_identity(request, datetime(2026, 7, 13, tzinfo=timezone.utc))

    assert identity.client_ip == "192.0.2.7"


def test_pseudonym_rotates_and_is_stable_within_window(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    monkeypatch.setattr(Config, "ANALYTICS_VISITOR_ROTATION_DAYS", 30)
    headers = {"User-Agent": "Mozilla/5.0 Chrome/126.0"}
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with app.test_request_context(
        "/", headers=headers, environ_base={"REMOTE_ADDR": "198.51.100.7"}
    ):
        first = derive_identity(request, start)
        same = derive_identity(request, start + timedelta(minutes=1))
        rotated = derive_identity(request, start + timedelta(days=31))
    assert first.visitor_key == same.visitor_key
    assert first.visitor_key != rotated.visitor_key


def test_ipwho_fallback_is_parsed_and_cached(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_URL", "https://ipwho.is")
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_DAILY_LIMIT", 1000)
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    response = Mock(status_code=200, headers={})
    response.json.return_value = {
        "success": True,
        "ip": "8.8.8.8",
        "country": "Romania",
        "country_code": "RO",
        "region": "București",
        "region_code": "B",
        "city": "București",
        "latitude": 44.4268,
        "longitude": 26.1025,
        "postal": "010011",
        "timezone": {"id": "Europe/Bucharest"},
        "connection": {"asn": 8708, "isp": "RCS & RDS"},
    }
    get = Mock(return_value=response)
    monkeypatch.setattr("src.analytics.privacy.requests.get", get)
    now = datetime(2026, 7, 13, tzinfo=timezone.utc)

    with app.test_request_context(
        "/",
        headers={"User-Agent": "Chrome/126"},
        environ_base={"REMOTE_ADDR": "8.8.8.8"},
    ):
        first = derive_identity(request, now)
        second = derive_identity(request, now + timedelta(minutes=1))

    assert first.country_name == "Romania"
    assert first.country_code == "RO"
    assert first.region_code == "B"
    assert first.city == "București"
    assert first.postal_code == "010011"
    assert first.timezone_name == "Europe/Bucharest"
    assert first.connection_asn == 8708
    assert first.connection_isp == "RCS & RDS"
    assert second.country_code == "RO"
    get.assert_called_once_with(
        "https://ipwho.is/8.8.8.8",
        params={
            "fields": (
                "success,message,ip,type,country,country_code,region,region_code,city,"
                "latitude,longitude,postal,timezone.id,connection.asn,connection.isp"
            )
        },
        timeout=1.5,
    )


def test_ipwho_failure_is_cached_and_does_not_break_collection(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    get = Mock(side_effect=requests.Timeout("geo provider unavailable"))
    monkeypatch.setattr("src.analytics.privacy.requests.get", get)
    now = datetime(2026, 7, 13, tzinfo=timezone.utc)

    with app.test_request_context(
        "/",
        headers={"User-Agent": "Chrome/126"},
        environ_base={"REMOTE_ADDR": "1.1.1.1"},
    ):
        first = derive_identity(request, now)
        second = derive_identity(request, now + timedelta(minutes=1))

    assert first.client_ip == second.client_ip == "1.1.1.1"
    assert first.country_code is None
    get.assert_called_once()


def test_ipwho_local_daily_limit_skips_additional_requests(app, monkeypatch):
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_GEOIP_DAILY_LIMIT", 1)
    monkeypatch.setattr(Config, "ANALYTICS_PSEUDONYM_KEY", "unit-test-key")
    response = Mock(status_code=200, headers={})
    response.json.return_value = {"success": True, "country_code": "RO"}
    get = Mock(return_value=response)
    monkeypatch.setattr("src.analytics.privacy.requests.get", get)
    now = datetime(2026, 7, 13, tzinfo=timezone.utc)

    with app.test_request_context(
        "/",
        headers={"User-Agent": "Chrome/126"},
        environ_base={"REMOTE_ADDR": "8.8.8.8"},
    ):
        derive_identity(request, now)
    with app.test_request_context(
        "/",
        headers={"User-Agent": "Chrome/126"},
        environ_base={"REMOTE_ADDR": "1.1.1.1"},
    ):
        second = derive_identity(request, now)

    get.assert_called_once()
    assert second.country_code is None


def test_suppression_allows_limited_events_and_respects_dnt_origin_and_bots(
    app, monkeypatch
):
    monkeypatch.setattr(Config, "ANALYTICS_ENABLED", True)
    monkeypatch.setattr(Config, "ANALYTICS_REQUIRE_CONSENT", True)
    monkeypatch.setattr(Config, "ALLOWED_ORIGINS", ["https://dentnow.ro"])
    with app.test_request_context("/", headers={"User-Agent": "Chrome/126"}):
        assert tracking_suppression_reason(request) is None
    with app.test_request_context(
        "/", headers={"User-Agent": "Chrome/126", "DNT": "1"}
    ):
        assert tracking_suppression_reason(request) == "privacy_signal"
    with app.test_request_context(
        "/", headers={"User-Agent": "Chrome/126", "Origin": "https://evil.test"}
    ):
        assert tracking_suppression_reason(request) == "origin_rejected"
    with app.test_request_context("/", headers={"User-Agent": "Googlebot"}):
        assert tracking_suppression_reason(request) == "bot"


def test_bounded_classification_and_referrer_hostname_only():
    assert classify_user_agent("Mozilla/5.0 (Windows) Edg/126")[1:] == (
        "Edge",
        "Windows",
    )
    assert referrer_host("https://Google.COM/search?q=patient-name") == "google.com"
