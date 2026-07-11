"""Seed idempotency — re-running the seed makes no changes (opt-in, seeded DB)."""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_SEED_TESTS") != "1",
    reason="RUN_SEED_TESTS != 1 (idempotency runs on a freshly seeded DB)",
)


def test_already_seeded_is_true():
    from scripts.seed_current_site import already_seeded
    from src.core.db import session_scope

    with session_scope() as session:
        assert already_seeded(session) is True


def test_rerun_is_a_noop():
    from sqlalchemy import func, select

    from scripts.seed_current_site import main
    from src.clinics.models import Clinic
    from src.core.db import session_scope

    with session_scope() as session:
        before = session.scalar(select(func.count()).select_from(Clinic))
    assert main() == 0  # prints "already seeded — no changes"
    with session_scope() as session:
        after = session.scalar(select(func.count()).select_from(Clinic))
    assert before == after
