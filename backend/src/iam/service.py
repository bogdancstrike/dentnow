"""Build a Principal from verified token claims and resolve clinic scopes.

Clinic scopes live in ``admin_principal_clinics`` (Task 7). To keep IAM testable and
decoupled from that table now, scope resolution goes through an injectable
``ClinicScopeProvider``. The default returns no scopes; Task 7 installs the DB-backed
provider.
"""
from __future__ import annotations

import uuid
from typing import Any, Callable, Protocol

from src.iam.capabilities import ALL_ROLES, ROLE_ADMIN
from src.iam.principal import Principal


class ClinicScopeProvider(Protocol):
    def __call__(self, subject: str) -> frozenset[uuid.UUID]: ...


def _no_scopes(subject: str) -> frozenset[uuid.UUID]:
    return frozenset()


_scope_provider: ClinicScopeProvider = _no_scopes


def set_clinic_scope_provider(provider: ClinicScopeProvider) -> None:
    """Install the clinic-scope resolver (DB-backed provider is wired in Task 7)."""
    global _scope_provider
    _scope_provider = provider


def reset_clinic_scope_provider() -> None:
    global _scope_provider
    _scope_provider = _no_scopes


def _realm_roles(claims: dict[str, Any]) -> frozenset[str]:
    roles = (claims.get("realm_access") or {}).get("roles") or []
    return frozenset(r for r in roles if r in ALL_ROLES)


def principal_from_claims(claims: dict[str, Any]) -> Principal:
    subject = claims["sub"]
    roles = _realm_roles(claims)
    # Only a clinic manager (and not also admin) is scope-limited.
    scopes: frozenset[uuid.UUID] = frozenset()
    if "dentnow_clinic_manager" in roles and ROLE_ADMIN not in roles:
        scopes = _scope_provider(subject)
    return Principal(
        subject=subject,
        username=claims.get("preferred_username"),
        email=claims.get("email"),
        roles=roles,
        clinic_scopes=scopes,
    )


def record_principal_seen(principal: Principal) -> None:
    """Upsert the last-seen identity metadata (best-effort; never blocks a request)."""
    from sqlalchemy.dialects.postgresql import insert

    from src.core.clock import utcnow
    from src.core.db import session_scope
    from src.iam.models import AdminPrincipal

    try:
        with session_scope() as session:
            stmt = insert(AdminPrincipal).values(
                subject=principal.subject,
                username=principal.username,
                email=principal.email,
                last_seen_at=utcnow(),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=[AdminPrincipal.subject],
                set_={
                    "username": stmt.excluded.username,
                    "email": stmt.excluded.email,
                    "last_seen_at": stmt.excluded.last_seen_at,
                },
            )
            session.execute(stmt)
    except Exception:  # pragma: no cover - metadata write must never fail a request
        pass


def synthetic_admin() -> Principal:
    """AUTH_DISABLED local smoke principal (never available in production)."""
    return Principal(subject="local-dev", username="local-dev", roles=frozenset({ROLE_ADMIN}))


# Convenience for callers that want a provider factory signature.
ScopeProviderFactory = Callable[[], ClinicScopeProvider]
