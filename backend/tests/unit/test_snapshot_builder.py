"""Snapshot determinism, ordering, and expired-offer exclusion."""
from __future__ import annotations

from datetime import date, timedelta

from src.catalog.service import OfferService
from src.clinics.service import ClinicService
from src.iam.capabilities import ROLE_ADMIN
from src.iam.principal import Principal
from src.site.snapshot_builder import build_snapshot, canonical_json, content_hash

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def test_hash_is_deterministic(db_session):
    ClinicService(db_session, ADMIN).create({"slug": "dristor", "name": "Dristor"})
    h1 = content_hash(build_snapshot(db_session))
    h2 = content_hash(build_snapshot(db_session))
    assert h1 == h2
    assert canonical_json(build_snapshot(db_session)) == canonical_json(build_snapshot(db_session))


def test_clinics_sorted_by_slug(db_session):
    ClinicService(db_session, ADMIN).create({"slug": "zzz", "name": "Z"})
    ClinicService(db_session, ADMIN).create({"slug": "aaa", "name": "A"})
    snap = build_snapshot(db_session)
    slugs = [c.slug for c in snap.clinics]
    assert slugs == sorted(slugs)


def test_expired_offer_excluded(db_session):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    OfferService(db_session, ADMIN).create({"slug": "old", "name": "Old", "status": "active",
                                            "starts_at": "2020-01-01", "ends_at": yesterday})
    OfferService(db_session, ADMIN).create({"slug": "live", "name": "Live", "status": "active",
                                            "starts_at": "2020-01-01", "ends_at": tomorrow})
    snap = build_snapshot(db_session)
    slugs = {o.slug for o in snap.offers}
    assert "live" in slugs
    assert "old" not in slugs  # expired excluded even though status=active
