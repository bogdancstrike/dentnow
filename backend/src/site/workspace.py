"""Workspace-version bookkeeping. Every workspace mutation increments
``site_state.workspace_version`` in the same transaction, so publishing can detect
whether anything changed since the active publication.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from src.site.models import SiteState


def bump_workspace_version(session: Session) -> int:
    state = session.get(SiteState, 1)
    if state is None:
        state = SiteState(id=1, workspace_version=1)
        session.add(state)
        session.flush()
        return state.workspace_version
    state.workspace_version = state.workspace_version + 1
    session.flush()
    return state.workspace_version


def current_workspace_version(session: Session) -> int:
    state = session.get(SiteState, 1)
    return state.workspace_version if state else 0
