"""The Principal — what every authorized admin handler receives."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Iterable

from src.iam.capabilities import (
    ALL_ROLES,
    ROLE_ADMIN,
    ROLE_CLINIC_MANAGER,
    capabilities_for,
)


@dataclass(frozen=True)
class Principal:
    subject: str
    username: str | None = None
    email: str | None = None
    roles: frozenset[str] = field(default_factory=frozenset)
    # Assigned clinic ids for a clinic manager (empty for global roles).
    clinic_scopes: frozenset[uuid.UUID] = field(default_factory=frozenset)

    @property
    def dentnow_roles(self) -> frozenset[str]:
        return frozenset(r for r in self.roles if r in ALL_ROLES)

    @property
    def is_admin(self) -> bool:
        return ROLE_ADMIN in self.roles

    @property
    def is_clinic_scoped(self) -> bool:
        """True when access is limited to assigned clinics (manager, not admin)."""
        return (not self.is_admin) and ROLE_CLINIC_MANAGER in self.roles

    @property
    def capabilities(self) -> frozenset[str]:
        return capabilities_for(self.dentnow_roles)

    def has_capability(self, capability: str) -> bool:
        return capability in self.capabilities

    def has_any_dentnow_role(self) -> bool:
        return bool(self.dentnow_roles)

    def can_access_clinic(self, clinic_id: uuid.UUID | None) -> bool:
        """Admins/global roles see everything; a clinic manager only assigned clinics."""
        if not self.is_clinic_scoped:
            return True
        if clinic_id is None:
            return False
        return clinic_id in self.clinic_scopes

    def has_any_role(self, roles: Iterable[str]) -> bool:
        return any(r in self.roles for r in roles)
