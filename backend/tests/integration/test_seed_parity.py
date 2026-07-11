"""Seed parity — runs against a freshly-seeded DB (compose `seed` flow).

Opt-in via RUN_SEED_TESTS=1 because the seed commits fixed slugs that would collide
with the unit-test fixtures on the shared host database.
"""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_SEED_TESTS") != "1",
    reason="RUN_SEED_TESTS != 1 (seed parity runs on a freshly seeded DB)",
)


def test_inventory_counts_match_expected():
    from scripts.verify_seed_parity import check
    from src.core.db import session_scope

    with session_scope() as session:
        mismatches = check(session)
    assert mismatches == [], "parity mismatches:\n" + "\n".join(mismatches)


def test_migration_baseline_publication_is_active():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.site.models import SitePublication, SiteState

    with session_scope() as session:
        pub = session.scalar(
            select(SitePublication).where(SitePublication.activation_reason == "migration_baseline")
        )
        assert pub is not None
        state = session.get(SiteState, 1)
        assert state.active_publication_id == pub.id


def test_no_route_from_inventory_is_missing():
    from sqlalchemy import select

    from src.core.db import session_scope
    from src.site.models import Page

    required = {"/", "/tratamente", "/oferte", "/articole", "/gdpr", "/confidentialitate", "/termeni"}
    with session_scope() as session:
        paths = {p for (p,) in session.execute(select(Page.path)).all()}
    assert required <= paths, f"missing routes: {required - paths}"
