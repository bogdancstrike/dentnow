"""DentNow backend configuration. All env-driven knobs live here.

DentNow is a modular monolith: a synchronous qf/Flask API over PostgreSQL and
MinIO. There is no Kafka, no Redis, no ETL worker, and no in-process scheduler in
the first release. A few Redis/Kafka defaults remain only because qf imports its
ETL modules eagerly even with ``enable_etl=False``; they configure nothing.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve the file from this module, not from the process working directory. This
# makes local commands, tests, Gunicorn and Alembic consistently read backend/.env.
# Real process/container variables keep precedence over values from the file.
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=False)


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).lower() in ("1", "true", "yes", "on")


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


class Config:
    # ── Application ────────────────────────────────────────────────────────
    SERVICE_NAME = os.getenv("SERVICE_NAME", "dentnow-api")
    API_PORT = _int("API_PORT", 5100)
    ENVIRONMENT = os.getenv("ENVIRONMENT", "local")  # local | test | production
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    # Build/source identity, exposed by /api/health. Set by CI / Docker build arg.
    BUILD_REVISION = os.getenv("BUILD_REVISION", "dev")

    ALLOWED_ORIGINS = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

    # ── PostgreSQL ─────────────────────────────────────────────────────────
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://dentnow:dentnow@localhost:5432/dentnow",
    )
    DB_POOL_SIZE = _int("DB_POOL_SIZE", 5)
    DB_MAX_OVERFLOW = _int("DB_MAX_OVERFLOW", 10)
    DB_POOL_TIMEOUT = _int("DB_POOL_TIMEOUT", 30)

    # ── MinIO / S3 (media store) ───────────────────────────────────────────
    S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")
    S3_BUCKET = os.getenv("S3_BUCKET", "dentnow-media")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
    S3_USE_PATH_STYLE = _bool("S3_USE_PATH_STYLE", True)

    # ── Keycloak ───────────────────────────────────────────────────────────
    # PUBLIC url  = what the browser and the issuer claim use (host-reachable).
    # INTERNAL url = what the API container uses to fetch JWKS (compose network).
    KEYCLOAK_PUBLIC_URL = os.getenv("KEYCLOAK_PUBLIC_URL", "http://localhost:8090")
    KEYCLOAK_INTERNAL_URL = os.getenv("KEYCLOAK_INTERNAL_URL", "http://localhost:8090")
    KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "doncik")
    KEYCLOAK_ADMIN_CLIENT_ID = os.getenv("KEYCLOAK_ADMIN_CLIENT_ID", "dentnow-api")

    KEYCLOAK_SPA_CLIENT_ID = os.getenv("KEYCLOAK_SPA_CLIENT_ID", "dentnow-admin-spa")
    KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "dentnow-api")
    KEYCLOAK_AUTHORIZED_PARTY = os.getenv(
        "KEYCLOAK_AUTHORIZED_PARTY", "dentnow-admin-spa"
    )
    KEYCLOAK_ISSUER = os.getenv(
        "KEYCLOAK_ISSUER",
        f"{KEYCLOAK_PUBLIC_URL.rstrip('/')}/realms/{KEYCLOAK_REALM}",
    )
    KEYCLOAK_JWKS_URL = os.getenv(
        "KEYCLOAK_JWKS_URL",
        f"{KEYCLOAK_INTERNAL_URL.rstrip('/')}/realms/{KEYCLOAK_REALM}"
        "/protocol/openid-connect/certs",
    )
    JWKS_CACHE_TTL = _int("JWKS_CACHE_TTL", 3600)
    # Bypass auth with a synthetic admin principal for local API smoke tests only.
    # Startup refuses this in production (see startup validation in a later task).
    AUTH_DISABLED = _bool("AUTH_DISABLED", False)

    # ── Preview sessions ───────────────────────────────────────────────────
    PREVIEW_TOKEN_TTL_SECONDS = _int("PREVIEW_TOKEN_TTL_SECONDS", 15 * 60)
    # Keyed hash pepper for one-use preview tokens (secret file in deployment).
    PREVIEW_TOKEN_PEPPER = os.getenv("PREVIEW_TOKEN_PEPPER", "dev-preview-pepper")

    # ── First-party analytics ─────────────────────────────────────────────
    # Collection remains opt-in at deployment level and consent-gated in the
    # browser. Network/location fields are never sourced from arbitrary payload
    # identity claims; browser coordinates require an explicit browser permission.
    ANALYTICS_ENABLED = _bool("ANALYTICS_ENABLED", False)
    ANALYTICS_REQUIRE_CONSENT = _bool("ANALYTICS_REQUIRE_CONSENT", True)
    ANALYTICS_PSEUDONYM_KEY = os.getenv(
        "ANALYTICS_PSEUDONYM_KEY", os.getenv("SECRET_KEY", "dev-secret-change-me")
    )
    ANALYTICS_KEY_VERSION = _int("ANALYTICS_KEY_VERSION", 1)
    ANALYTICS_VISITOR_ROTATION_DAYS = _int("ANALYTICS_VISITOR_ROTATION_DAYS", 30)
    ANALYTICS_SESSION_MINUTES = _int("ANALYTICS_SESSION_MINUTES", 30)
    ANALYTICS_EVENT_RETENTION_DAYS = _int("ANALYTICS_EVENT_RETENTION_DAYS", 90)
    ANALYTICS_AGGREGATE_RETENTION_DAYS = _int("ANALYTICS_AGGREGATE_RETENTION_DAYS", 730)
    ANALYTICS_RATE_LIMIT_PER_MINUTE = _int("ANALYTICS_RATE_LIMIT_PER_MINUTE", 60)
    ANALYTICS_USER_AGENT_MAX_LENGTH = _int("ANALYTICS_USER_AGENT_MAX_LENGTH", 512)
    ANALYTICS_TRUSTED_PROXY_CIDRS = tuple(
        item.strip()
        for item in os.getenv("ANALYTICS_TRUSTED_PROXY_CIDRS", "127.0.0.1/32,::1/128,172.16.0.0/12").split(",")
        if item.strip()
    )

    # ── Tracing ────────────────────────────────────────────────────────────
    ENABLE_TRACING = _bool("ENABLE_TRACING", False)
    OTLP_ENDPOINT = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")

    # ── qf ETL import-chain defaults ───────────────────────────────────────
    # qf imports its ETL module eagerly (even with enable_etl=False) and evaluates
    # several ``Config.*`` values as function default arguments AT IMPORT TIME:
    # WORKER_NAME, ERROR_TOPIC, REDIS_HOST/PORT/DB, SECRET_KEY. These configure
    # nothing in DentNow — there is no Kafka, Redis, or worker — but they must exist
    # or ``from framework.app import ...`` raises AttributeError.
    WORKER_NAME = os.getenv("WORKER_NAME", "dentnow-workers")
    ERROR_TOPIC = os.getenv("ERROR_TOPIC", "dentnow-errors")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = os.getenv("REDIS_PORT", "6379")
    REDIS_DB = os.getenv("REDIS_DB", "0")
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")

    # Flask session/signing key (qf reads Config.SECRET_KEY). DentNow creates no auth
    # cookies; startup validation (a later task) rejects this dev default in prod.
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENVIRONMENT.lower() == "production"
