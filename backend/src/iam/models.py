"""IAM tables. ``admin_principals`` records Keycloak subjects last seen in the admin
API — never a password store. ``admin_principal_clinics`` (clinic-manager scope) is
added in Task 7 once the ``clinics`` table exists.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base


class AdminPrincipal(Base):
    __tablename__ = "admin_principals"
    __table_args__ = (Index("uq_admin_principals_subject", "subject", unique=True),)

    subject: Mapped[str] = mapped_column(Text, primary_key=True)
    username: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
