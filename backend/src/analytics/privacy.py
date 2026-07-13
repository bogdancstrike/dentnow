"""Request-derived analytics identity and privacy controls."""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

from src.config import Config

BOT_PATTERN = re.compile(
    r"bot|crawler|spider|slurp|headless|lighthouse|preview|facebookexternalhit|"
    r"whatsapp|telegrambot|curl/|wget/|python-requests|uptime",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class RequestIdentity:
    client_ip: str
    user_agent: str
    visitor_key: bytes
    session_key: bytes
    key_version: int
    device_family: str
    browser_family: str
    os_family: str
    country_code: str | None
    region: str | None
    city: str | None
    latitude: Decimal | None
    longitude: Decimal | None


def _bounded(value: str | None, limit: int) -> str | None:
    if not value:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned[:limit] or None


def _trusted_peer(peer: str | None) -> bool:
    if not peer:
        return False
    try:
        address = ipaddress.ip_address(peer)
        return any(
            address in ipaddress.ip_network(cidr, strict=False)
            for cidr in Config.ANALYTICS_TRUSTED_PROXY_CIDRS
        )
    except ValueError:
        return False


def client_ip_from_request(request) -> str:
    peer = request.remote_addr or "127.0.0.1"
    candidate = peer
    if _trusted_peer(peer):
        forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if forwarded:
            candidate = forwarded
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return "0.0.0.0"


def classify_user_agent(user_agent: str) -> tuple[str, str, str]:
    ua = user_agent.lower()
    if "ipad" in ua or "tablet" in ua or ("android" in ua and "mobile" not in ua):
        device = "tablet"
    elif any(token in ua for token in ("mobile", "iphone", "ipod", "android")):
        device = "mobile"
    elif ua:
        device = "desktop"
    else:
        device = "other"

    if "edg/" in ua or "edge/" in ua:
        browser = "Edge"
    elif "firefox/" in ua or "fxios/" in ua:
        browser = "Firefox"
    elif "chrome/" in ua or "crios/" in ua:
        browser = "Chrome"
    elif "safari/" in ua:
        browser = "Safari"
    else:
        browser = "Other"

    if "windows" in ua:
        os_family = "Windows"
    elif "android" in ua:
        os_family = "Android"
    elif "iphone" in ua or "ipad" in ua or "ios" in ua:
        os_family = "iOS"
    elif "mac os" in ua or "macintosh" in ua:
        os_family = "macOS"
    elif "linux" in ua:
        os_family = "Linux"
    else:
        os_family = "Other"
    return device, browser, os_family


def is_bot(user_agent: str) -> bool:
    return not user_agent.strip() or bool(BOT_PATTERN.search(user_agent))


def referrer_host(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = urlparse(value)
        host = parsed.hostname
        return host.lower()[:253] if host else None
    except ValueError:
        return None


def origin_is_allowed(request) -> bool:
    origin = request.headers.get("Origin")
    if not origin:
        return True  # non-browser clients; auth/consent/rate controls still apply
    normalized = origin.rstrip("/")
    return normalized in {item.rstrip("/") for item in Config.ALLOWED_ORIGINS}


def tracking_suppression_reason(request) -> str | None:
    if not Config.ANALYTICS_ENABLED:
        return "disabled"
    if request.headers.get("DNT") == "1" or request.headers.get("Sec-GPC") == "1":
        return "privacy_signal"
    if not origin_is_allowed(request):
        return "origin_rejected"
    if is_bot(request.headers.get("User-Agent", "")):
        return "bot"
    return None


def _decimal_header(value: str | None, lower: int, upper: int) -> Decimal | None:
    try:
        result = Decimal(value) if value else None
        return result if result is not None and lower <= result <= upper else None
    except (InvalidOperation, ValueError):
        return None


def _geo(
    request,
) -> tuple[str | None, str | None, str | None, Decimal | None, Decimal | None]:
    # Geo headers are trusted only from a configured reverse proxy/CDN.
    if not _trusted_peer(request.remote_addr):
        return None, None, None, None, None
    country = _bounded(
        request.headers.get("CF-IPCountry") or request.headers.get("X-Geo-Country"), 2
    )
    if country:
        country = country.upper() if country.isalpha() and len(country) == 2 else None
    region = _bounded(
        request.headers.get("CF-Region") or request.headers.get("X-Geo-Region"), 120
    )
    city = _bounded(
        request.headers.get("CF-IPCity") or request.headers.get("X-Geo-City"), 120
    )
    latitude = _decimal_header(
        request.headers.get("CF-IPLatitude") or request.headers.get("X-Geo-Latitude"),
        -90,
        90,
    )
    longitude = _decimal_header(
        request.headers.get("CF-IPLongitude") or request.headers.get("X-Geo-Longitude"),
        -180,
        180,
    )
    return country, region, city, latitude, longitude


def derive_identity(request, now: datetime | None = None) -> RequestIdentity:
    now = now or datetime.now(timezone.utc)
    ip = client_ip_from_request(request)
    ua = (
        _bounded(
            request.headers.get("User-Agent"), Config.ANALYTICS_USER_AGENT_MAX_LENGTH
        )
        or "Unknown"
    )
    device, browser, os_family = classify_user_agent(ua)
    rotation = now.date().toordinal() // max(1, Config.ANALYTICS_VISITOR_ROTATION_DAYS)
    pepper = Config.ANALYTICS_PSEUDONYM_KEY.encode("utf-8")
    visitor_material = f"v{Config.ANALYTICS_KEY_VERSION}|{rotation}|{ip}|{ua}".encode(
        "utf-8"
    )
    visitor = hmac.new(pepper, visitor_material, hashlib.sha256).digest()
    session_bucket = int(now.timestamp()) // max(
        60, Config.ANALYTICS_SESSION_MINUTES * 60
    )
    session = hmac.new(
        pepper, visitor + str(session_bucket).encode("ascii"), hashlib.sha256
    ).digest()
    country, region, city, latitude, longitude = _geo(request)
    return RequestIdentity(
        client_ip=ip,
        user_agent=ua,
        visitor_key=visitor,
        session_key=session,
        key_version=Config.ANALYTICS_KEY_VERSION,
        device_family=device,
        browser_family=browser,
        os_family=os_family,
        country_code=country,
        region=region,
        city=city,
        latitude=latitude,
        longitude=longitude,
    )
