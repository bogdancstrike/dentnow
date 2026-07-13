"""Production-like loaded seed inventory and idempotency (opt-in, isolated DB)."""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_LOADED_SEED_TESTS") != "1",
    reason="RUN_LOADED_SEED_TESTS != 1 (loaded seed tests require an isolated seeded DB)",
)


def _counts() -> dict[str, int]:
    from sqlalchemy import func, select

    from src.catalog.models import Offer, Treatment
    from src.clinics.models import Clinic, Doctor
    from src.core.db import session_scope
    from src.editorial.models import Article
    from src.site.models import SitePublication

    with session_scope() as session:
        return {
            "clinics": session.scalar(select(func.count()).select_from(Clinic)) or 0,
            "doctors": session.scalar(select(func.count()).select_from(Doctor)) or 0,
            "treatments": session.scalar(select(func.count()).select_from(Treatment)) or 0,
            "offers": session.scalar(select(func.count()).select_from(Offer)) or 0,
            "articles": session.scalar(select(func.count()).select_from(Article)) or 0,
            "loaded_publications": session.scalar(
                select(func.count()).select_from(SitePublication).where(
                    SitePublication.activation_reason == "loaded_seed"
                )
            ) or 0,
        }


def test_loaded_seed_has_expected_default_plus_synthetic_inventory() -> None:
    assert _counts() == {
        "clinics": 27,
        "doctors": 75,
        "treatments": 146,
        "offers": 54,
        "articles": 257,
        "loaded_publications": 1,
    }


def test_loaded_seed_rerun_is_a_noop() -> None:
    from seed_loaded import main

    before = _counts()
    assert main() == 0
    assert _counts() == before
