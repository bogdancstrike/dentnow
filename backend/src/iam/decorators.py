"""Auth decorators wrapping qf handler functions.

qf handlers have signature ``handler(app, operation, request, **kwargs)``. The
decorated version verifies the bearer token, builds a Principal, injects it as
``principal=<Principal>``, and enforces a required capability. Domain errors become
``(body, status)`` tuples that flask-restx serializes, always carrying the
correlation id.

Every wrapper stamps ``__dentnow_protected__`` and ``__dentnow_capability__`` so the
route-map default-deny contract test can prove every ``/api/v1/admin/*`` handler is
guarded.
"""
from __future__ import annotations

from functools import wraps
from typing import Callable

from flask import g
from flask import request as flask_request

from src.config import Config
from src.core.errors import AuthenticationError, DentNowError, PermissionDeniedError
from src.iam.principal import Principal
from src.iam.service import (
    principal_from_claims,
    record_principal_seen,
    synthetic_admin,
)
from src.iam.token_verifier import verify_token


def _build_principal() -> Principal:
    if Config.AUTH_DISABLED and not Config.is_production():
        principal = synthetic_admin()
        g.principal = principal
        return principal
    auth = flask_request.headers.get("Authorization") or ""
    if not auth.lower().startswith("bearer "):
        raise AuthenticationError("missing bearer token")
    token = auth.split(" ", 1)[1].strip()
    principal = principal_from_claims(verify_token(token))
    g.principal = principal
    record_principal_seen(principal)
    return principal


def _err(err: DentNowError):
    body = err.to_dict()
    cid = getattr(g, "correlation_id", None)
    if cid:
        body["correlation_id"] = cid
    return body, err.status_code


def require_authenticated(fn: Callable) -> Callable:
    """Require a valid token + a DentNow realm role (else 401/403)."""

    @wraps(fn)
    def wrapper(app, operation, request, **kwargs):
        try:
            principal = _build_principal()
            if not principal.has_any_dentnow_role():
                raise PermissionDeniedError("no DentNow role assigned")
            kwargs["principal"] = principal
            return fn(app, operation, request, **kwargs)
        except DentNowError as e:
            return _err(e)

    wrapper.__dentnow_protected__ = True  # type: ignore[attr-defined]
    wrapper.__dentnow_capability__ = None  # type: ignore[attr-defined]
    return wrapper


def require_capability(capability: str) -> Callable[[Callable], Callable]:
    """Default-deny: require a valid token AND an explicit capability."""

    def deco(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(app, operation, request, **kwargs):
            try:
                principal = _build_principal()
                if not principal.has_capability(capability):
                    raise PermissionDeniedError(
                        f"requires capability: {capability}",
                        details={"required_capability": capability},
                    )
                kwargs["principal"] = principal
                return fn(app, operation, request, **kwargs)
            except DentNowError as e:
                return _err(e)

        wrapper.__dentnow_protected__ = True  # type: ignore[attr-defined]
        wrapper.__dentnow_capability__ = capability  # type: ignore[attr-defined]
        return wrapper

    return deco
