"""Request-derived analytics identity and privacy controls."""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import re
from collections import OrderedDict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from email.utils import parsedate_to_datetime
from threading import Lock
from urllib.parse import urlparse

import requests

from src.config import Config

BOT_PATTERN = re.compile(
    r"bot|crawler|spider|slurp|headless|lighthouse|preview|facebookexternalhit|"
    r"whatsapp|telegrambot|curl/|wget/|python-requests|uptime",
    re.IGNORECASE,
)
GEOIP_FIELDS = (
    "success,message,ip,type,"
    "country,country_code,region,region_code,city,"
    "latitude,longitude,postal,"
    "timezone.id,connection.asn,connection.isp"
)


@dataclass(frozen=True)
class GeoLocation:
    country_name: str | None = None
    country_code: str | None = None
    region: str | None = None
    region_code: str | None = None
    city: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    postal_code: str | None = None
    timezone_name: str | None = None
    connection_asn: int | None = None
    connection_isp: str | None = None


@dataclass(frozen=True)
class _GeoCacheEntry:
    location: GeoLocation | None
    expires_at: datetime


_GEOIP_CACHE: OrderedDict[str, _GeoCacheEntry] = OrderedDict()
_GEOIP_LOCK = Lock()
_GEOIP_USAGE_DAY: date | None = None
_GEOIP_REQUEST_COUNT = 0
_GEOIP_BLOCKED_UNTIL: datetime | None = None


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
    country_name: str | None
    country_code: str | None
    region: str | None
    region_code: str | None
    city: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    postal_code: str | None
    timezone_name: str | None
    connection_asn: int | None
    connection_isp: str | None


def _bounded(value: object | None, limit: int) -> str | None:
    if not value:
        return None
    cleaned = " ".join(str(value).strip().split())
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


def _decimal_value(value: object, lower: int, upper: int) -> Decimal | None:
    try:
        result = Decimal(str(value)) if value is not None and value != "" else None
        return result if result is not None and lower <= result <= upper else None
    except (InvalidOperation, ValueError, TypeError):
        return None


def _country_code(value: object) -> str | None:
    country = _bounded(str(value) if value is not None else None, 2)
    return (
        country.upper() if country and country.isalpha() and len(country) == 2 else None
    )


def _geo_from_headers(request) -> GeoLocation:
    # Geo headers are trusted only from a configured reverse proxy/CDN.
    if not _trusted_peer(request.remote_addr):
        return GeoLocation()
    country = _country_code(
        request.headers.get("CF-IPCountry") or request.headers.get("X-Geo-Country")
    )
    region = _bounded(
        request.headers.get("CF-Region") or request.headers.get("X-Geo-Region"), 120
    )
    city = _bounded(
        request.headers.get("CF-IPCity") or request.headers.get("X-Geo-City"), 120
    )
    latitude = _decimal_value(
        request.headers.get("CF-IPLatitude") or request.headers.get("X-Geo-Latitude"),
        -90,
        90,
    )
    longitude = _decimal_value(
        request.headers.get("CF-IPLongitude") or request.headers.get("X-Geo-Longitude"),
        -180,
        180,
    )
    return GeoLocation(
        country_code=country,
        region=region,
        city=city,
        latitude=latitude,
        longitude=longitude,
    )


def _public_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_global
    except ValueError:
        return False


def _cache_get(ip: str, now: datetime) -> tuple[bool, GeoLocation | None]:
    with _GEOIP_LOCK:
        entry = _GEOIP_CACHE.get(ip)
        if entry is None:
            return False, None
        if entry.expires_at <= now:
            del _GEOIP_CACHE[ip]
            return False, None
        _GEOIP_CACHE.move_to_end(ip)
        return True, entry.location


def _cache_put(
    ip: str, location: GeoLocation | None, now: datetime, *, failure: bool = False
) -> None:
    ttl = (
        timedelta(minutes=max(1, Config.ANALYTICS_GEOIP_FAILURE_CACHE_MINUTES))
        if failure
        else timedelta(hours=max(1, Config.ANALYTICS_GEOIP_CACHE_HOURS))
    )
    with _GEOIP_LOCK:
        _GEOIP_CACHE[ip] = _GeoCacheEntry(location=location, expires_at=now + ttl)
        _GEOIP_CACHE.move_to_end(ip)
        maximum = max(1, Config.ANALYTICS_GEOIP_CACHE_MAX_ENTRIES)
        while len(_GEOIP_CACHE) > maximum:
            _GEOIP_CACHE.popitem(last=False)


def _reserve_geoip_request(now: datetime) -> bool:
    global _GEOIP_USAGE_DAY, _GEOIP_REQUEST_COUNT, _GEOIP_BLOCKED_UNTIL
    with _GEOIP_LOCK:
        if _GEOIP_USAGE_DAY != now.date():
            _GEOIP_USAGE_DAY = now.date()
            _GEOIP_REQUEST_COUNT = 0
        if _GEOIP_BLOCKED_UNTIL is not None:
            if now < _GEOIP_BLOCKED_UNTIL:
                return False
            _GEOIP_BLOCKED_UNTIL = None
        daily_limit = min(1000, max(0, Config.ANALYTICS_GEOIP_DAILY_LIMIT))
        if _GEOIP_REQUEST_COUNT >= daily_limit:
            return False
        _GEOIP_REQUEST_COUNT += 1
        return True


def _block_geoip_after_rate_limit(now: datetime, retry_after: str | None) -> None:
    global _GEOIP_BLOCKED_UNTIL
    blocked_until = now + timedelta(days=1)
    if retry_after:
        try:
            if retry_after.strip().isdigit():
                blocked_until = now + timedelta(seconds=max(1, int(retry_after)))
            else:
                parsed = parsedate_to_datetime(retry_after)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                blocked_until = max(now + timedelta(seconds=1), parsed)
        except (TypeError, ValueError, OverflowError):
            pass
    with _GEOIP_LOCK:
        _GEOIP_BLOCKED_UNTIL = blocked_until


def _nested(payload: dict, section: str, field: str) -> object | None:
    nested = payload.get(section)
    if isinstance(nested, dict):
        return nested.get(field)
    return payload.get(f"{section}.{field}")


def _asn(value: object) -> int | None:
    try:
        parsed = int(value) if value is not None else None
        return (
            parsed
            if parsed is not None and 0 < parsed <= 9_223_372_036_854_775_807
            else None
        )
    except (TypeError, ValueError):
        return None


def _geoip_lookup(ip: str, now: datetime) -> GeoLocation | None:
    if not Config.ANALYTICS_GEOIP_ENABLED or not _public_ip(ip):
        return None
    cached, location = _cache_get(ip, now)
    if cached:
        return location
    if not _reserve_geoip_request(now):
        return None

    try:
        response = requests.get(
            f"{Config.ANALYTICS_GEOIP_URL.rstrip('/')}/{ip}",
            params={"fields": GEOIP_FIELDS},
            timeout=max(0.1, Config.ANALYTICS_GEOIP_TIMEOUT_SECONDS),
        )
        if response.status_code == 429:
            _block_geoip_after_rate_limit(now, response.headers.get("Retry-After"))
            _cache_put(ip, None, now, failure=True)
            return None
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict) or payload.get("success") is not True:
            _cache_put(ip, None, now, failure=True)
            return None
        returned_ip = payload.get("ip")
        if (
            returned_ip is not None
            and str(ipaddress.ip_address(str(returned_ip))) != ip
        ):
            _cache_put(ip, None, now, failure=True)
            return None
        location = GeoLocation(
            country_name=_bounded(payload.get("country"), 120),
            country_code=_country_code(payload.get("country_code")),
            region=_bounded(payload.get("region"), 120),
            region_code=_bounded(payload.get("region_code"), 32),
            city=_bounded(payload.get("city"), 120),
            latitude=_decimal_value(payload.get("latitude"), -90, 90),
            longitude=_decimal_value(payload.get("longitude"), -180, 180),
            postal_code=_bounded(payload.get("postal"), 32),
            timezone_name=_bounded(_nested(payload, "timezone", "id"), 80),
            connection_asn=_asn(_nested(payload, "connection", "asn")),
            connection_isp=_bounded(_nested(payload, "connection", "isp"), 240),
        )
        _cache_put(ip, location, now)
        return location
    except (requests.RequestException, ValueError, TypeError):
        _cache_put(ip, None, now, failure=True)
        return None


def _geo(request, ip: str, now: datetime) -> GeoLocation:
    proxy_geo = _geo_from_headers(request)
    core_complete = all(
        value is not None
        for value in (
            proxy_geo.country_code,
            proxy_geo.region,
            proxy_geo.city,
            proxy_geo.latitude,
            proxy_geo.longitude,
        )
    )
    fallback = None if core_complete else _geoip_lookup(ip, now)
    if fallback is None:
        return proxy_geo
    return GeoLocation(
        country_name=fallback.country_name,
        country_code=proxy_geo.country_code or fallback.country_code,
        region=proxy_geo.region or fallback.region,
        region_code=fallback.region_code,
        city=proxy_geo.city or fallback.city,
        latitude=(
            proxy_geo.latitude if proxy_geo.latitude is not None else fallback.latitude
        ),
        longitude=(
            proxy_geo.longitude
            if proxy_geo.longitude is not None
            else fallback.longitude
        ),
        postal_code=fallback.postal_code,
        timezone_name=fallback.timezone_name,
        connection_asn=fallback.connection_asn,
        connection_isp=fallback.connection_isp,
    )


def _reset_geoip_state_for_tests() -> None:
    global _GEOIP_USAGE_DAY, _GEOIP_REQUEST_COUNT, _GEOIP_BLOCKED_UNTIL
    with _GEOIP_LOCK:
        _GEOIP_CACHE.clear()
        _GEOIP_USAGE_DAY = None
        _GEOIP_REQUEST_COUNT = 0
        _GEOIP_BLOCKED_UNTIL = None


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
    geo = _geo(request, ip, now)
    return RequestIdentity(
        client_ip=ip,
        user_agent=ua,
        visitor_key=visitor,
        session_key=session,
        key_version=Config.ANALYTICS_KEY_VERSION,
        device_family=device,
        browser_family=browser,
        os_family=os_family,
        country_name=geo.country_name,
        country_code=geo.country_code,
        region=geo.region,
        region_code=geo.region_code,
        city=geo.city,
        latitude=geo.latitude,
        longitude=geo.longitude,
        postal_code=geo.postal_code,
        timezone_name=geo.timezone_name,
        connection_asn=geo.connection_asn,
        connection_isp=geo.connection_isp,
    )
