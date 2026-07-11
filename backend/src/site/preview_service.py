"""Preview sessions: one-use fragment token -> short-lived HttpOnly cookie."""
from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from sqlalchemy import select

from src.config import Config
from src.core.clock import utcnow
from src.core.errors import AuthenticationError
from src.site.models import PreviewSession
from src.site.snapshot_builder import build_snapshot

PREVIEW_TTL = timedelta(seconds=Config.PREVIEW_TOKEN_TTL_SECONDS)


def _hash(token: str) -> str:
    return hashlib.sha256(f"{Config.PREVIEW_TOKEN_PEPPER}:{token}".encode("utf-8")).hexdigest()


def create_preview(session, principal) -> dict:
    """Freeze the current (permitted) snapshot; return a one-use 256-bit token."""
    snapshot = build_snapshot(session)
    token = secrets.token_urlsafe(32)
    row = PreviewSession(
        token_hash=_hash(token),
        snapshot=snapshot.model_dump(mode="json"),
        created_by=principal.subject,
        expires_at=utcnow() + PREVIEW_TTL,
    )
    session.add(row)
    session.flush()
    return {"token": token, "expires_at": row.expires_at.isoformat(), "preview_id": str(row.id)}


def _live_by_hash(session, token_hash: str) -> PreviewSession | None:
    row = session.scalar(select(PreviewSession).where(PreviewSession.token_hash == token_hash))
    if row is None or row.revoked_at is not None or row.expires_at < utcnow():
        return None
    return row


def exchange_token(session, token: str) -> str:
    """Consume the one-use fragment token; rotate to a session secret (the cookie value)."""
    row = _live_by_hash(session, _hash(token))
    if row is None:
        raise AuthenticationError("invalid or expired preview token")
    session_secret = secrets.token_urlsafe(32)
    row.token_hash = _hash(session_secret)  # invalidates the one-use token
    session.flush()
    return session_secret


def session_from_cookie(session, cookie_value: str | None) -> PreviewSession:
    if not cookie_value:
        raise AuthenticationError("missing preview session")
    row = _live_by_hash(session, _hash(cookie_value))
    if row is None:
        raise AuthenticationError("invalid or expired preview session")
    return row


def revoke(session, cookie_value: str | None) -> None:
    if not cookie_value:
        return
    row = session.scalar(select(PreviewSession).where(PreviewSession.token_hash == _hash(cookie_value)))
    if row is not None and row.revoked_at is None:
        row.revoked_at = utcnow()
        session.flush()
