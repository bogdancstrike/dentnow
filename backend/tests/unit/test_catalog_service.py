"""Catalog service + schema + DB-constraint tests."""
from __future__ import annotations

import uuid

import pytest
from pydantic import ValidationError as PydValidationError
from sqlalchemy.exc import IntegrityError

from src.catalog.models import Offer, TreatmentPrice
from src.catalog.schemas import OfferCreate, PriceCreate
from src.catalog.service import (
    CategoryService,
    OfferService,
    PriceService,
    TreatmentService,
)
from src.core.errors import ConflictError, PermissionDeniedError, ValidationError
from src.iam.capabilities import ROLE_ADMIN, ROLE_CLINIC_MANAGER
from src.iam.principal import Principal

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))
MANAGER = Principal(subject="mgr", roles=frozenset({ROLE_CLINIC_MANAGER}), clinic_scopes=frozenset({uuid.uuid4()}))


def _treatment(session, slug="implant"):
    return TreatmentService(session, ADMIN).create({"slug": slug, "name": "Implant"})[0]


def test_category_unique_slug(db_session):
    svc = CategoryService(db_session, ADMIN)
    svc.create({"slug": "estetica", "label": "Estetică"})
    with pytest.raises(ConflictError):
        svc.create({"slug": "estetica", "label": "Dup"})


def test_price_schema_requires_amount_for_exact():
    with pytest.raises(PydValidationError):
        PriceCreate(treatment_id="x", price_kind="exact")


def test_price_schema_range_needs_ordered_bounds():
    with pytest.raises(PydValidationError):
        PriceCreate(treatment_id="x", price_kind="range", amount=500, amount_max=100)
    ok = PriceCreate(treatment_id="x", price_kind="range", amount=100, amount_max=500)
    assert ok.amount_max == 500


def test_price_schema_currency_format():
    with pytest.raises(PydValidationError):
        PriceCreate(treatment_id="x", price_kind="exact", amount=1, currency="lei")


def test_offer_schema_date_rule():
    with pytest.raises(PydValidationError):
        OfferCreate(slug="o", name="O", starts_at="2026-02-01", ends_at="2026-01-01")


def test_db_rejects_negative_price_amount(db_session):
    t = _treatment(db_session)
    db_session.add(TreatmentPrice(treatment_id=uuid.UUID(t["id"]), price_kind="exact", amount=-5, currency="RON"))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_db_rejects_offer_bad_date_window(db_session):
    db_session.add(Offer(slug="bad", name="Bad", currency="RON", starts_at="2026-02-01", ends_at="2026-01-01"))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_manager_cannot_write_global_catalog(db_session):
    svc = OfferService(db_session, MANAGER)
    with pytest.raises(PermissionDeniedError):
        svc.create({"slug": "promo", "name": "Promo"})


def test_manager_price_must_target_assigned_clinic(db_session):
    t = _treatment(db_session)
    svc = PriceService(db_session, MANAGER)
    # No/global clinic -> rejected for a manager.
    with pytest.raises(ValidationError):
        svc.create({"treatment_id": t["id"], "price_kind": "exact", "amount": 100, "currency": "RON"})
