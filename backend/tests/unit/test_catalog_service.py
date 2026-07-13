"""Catalog service + schema + DB-constraint tests."""
from __future__ import annotations

import uuid

import pytest
from pydantic import ValidationError as PydValidationError
from sqlalchemy.exc import IntegrityError

from src.catalog.models import Offer, TreatmentPrice
from src.catalog.schemas import OfferCreate, OfferUpdate, PriceCreate
from src.catalog.service import (
    CategoryService,
    OfferService,
    PriceService,
    TreatmentService,
)
from src.clinics.service import ClinicService
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


def test_offer_features_sync_roundtrip(db_session):
    """features is edited inline but persisted in the offer_features child table."""
    svc = OfferService(db_session, ADMIN)
    created, _ = svc.create(
        OfferCreate(slug="promo-feat", name="Promo", features=["A", "B", "C"]).model_dump()
    )
    assert created["features"] == ["A", "B", "C"]
    # Round-trips via GET/serialize (reads live child rows, ordered by position).
    fetched, etag = svc.get(uuid.UUID(created["id"]))
    assert fetched["features"] == ["A", "B", "C"]
    # Update replaces the whole set; empty list clears it.
    updated, etag = svc.update(
        uuid.UUID(created["id"]), OfferUpdate(features=["X"]).model_dump(exclude_unset=True), etag
    )
    assert updated["features"] == ["X"]
    fetched2, _ = svc.get(uuid.UUID(created["id"]))
    assert fetched2["features"] == ["X"]


def test_offer_features_accepts_comma_string(db_session):
    """The editor sends a single comma-separated string; the schema coerces it."""
    svc = OfferService(db_session, ADMIN)
    created, _ = svc.create(
        OfferCreate(slug="promo-csv", name="Promo", features="  One, Two ,, Three ").model_dump()
    )
    assert created["features"] == ["One", "Two", "Three"]


def test_offer_related_treatments_and_clinics_sync_roundtrip(db_session):
    first_treatment = _treatment(db_session, "implant-offer")
    second_treatment = _treatment(db_session, "igienizare-offer")
    clinic = ClinicService(db_session, ADMIN).create(
        {"slug": "clinica-oferta", "name": "Clinica ofertă"}
    )[0]
    svc = OfferService(db_session, ADMIN)

    created, etag = svc.create(OfferCreate(
        slug="oferta-relationata",
        name="Ofertă relaționată",
        treatment_ids=[first_treatment["id"], second_treatment["id"], first_treatment["id"]],
        clinic_ids=[clinic["id"]],
    ).model_dump())
    assert set(created["treatment_ids"]) == {first_treatment["id"], second_treatment["id"]}
    assert created["clinic_ids"] == [clinic["id"]]

    updated, _ = svc.update(
        uuid.UUID(created["id"]),
        OfferUpdate(treatment_ids=[second_treatment["id"]], clinic_ids=[]).model_dump(exclude_unset=True),
        etag,
    )
    assert updated["treatment_ids"] == [second_treatment["id"]]
    assert updated["clinic_ids"] == []
    fetched, _ = svc.get(uuid.UUID(created["id"]))
    assert fetched["treatment_ids"] == [second_treatment["id"]]
    assert fetched["clinic_ids"] == []


def test_offer_rejects_unknown_related_resource(db_session):
    with pytest.raises(ValidationError) as exc_info:
        OfferService(db_session, ADMIN).create(OfferCreate(
            slug="oferta-invalida",
            name="Ofertă invalidă",
            treatment_ids=[str(uuid.uuid4())],
        ).model_dump())
    assert exc_info.value.details["field"] == "treatment_ids"


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
