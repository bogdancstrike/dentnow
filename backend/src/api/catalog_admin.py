"""Admin CRUD handlers for treatments, prices, offers, technology, partners."""
from __future__ import annotations

from src.api._helpers import do_create, do_delete, do_get, do_list, do_update
from src.catalog.schemas import (
    CategoryCreate,
    CategoryUpdate,
    OfferCreate,
    OfferFeatureCreate,
    OfferFeatureUpdate,
    OfferUpdate,
    PartnerCreate,
    PartnerUpdate,
    PriceCreate,
    PriceUpdate,
    TechnologyCreate,
    TechnologyUpdate,
    TreatmentCreate,
    TreatmentFaqCreate,
    TreatmentFaqUpdate,
    TreatmentUpdate,
)
from src.catalog.service import (
    CategoryService,
    OfferFeatureService,
    OfferService,
    PartnerService,
    PriceService,
    TechnologyService,
    TreatmentFaqService,
    TreatmentService,
)
from src.iam.capabilities import CAP_CONTENT_READ, CAP_CONTENT_WRITE
from src.iam.decorators import require_capability


def _crud(prefix, service, create_schema, update_schema, id_param, *, has_get=False):
    """Attach 4–5 module-level handlers for a resource. Returns nothing; defines names."""
    g = globals()

    @require_capability(CAP_CONTENT_READ)
    def _list(app, operation, request, principal=None, **kw):
        return do_list(service, principal)

    @require_capability(CAP_CONTENT_WRITE)
    def _create(app, operation, request, principal=None, **kw):
        return do_create(service, create_schema, principal)

    @require_capability(CAP_CONTENT_WRITE)
    def _update(app, operation, request, principal=None, **kw):
        return do_update(service, update_schema, principal, kw.get(id_param))

    @require_capability(CAP_CONTENT_WRITE)
    def _delete(app, operation, request, principal=None, **kw):
        return do_delete(service, principal, kw.get(id_param))

    g[f"{prefix}_list"] = _list
    g[f"{prefix}_create"] = _create
    g[f"{prefix}_update"] = _update
    g[f"{prefix}_delete"] = _delete

    if has_get:
        @require_capability(CAP_CONTENT_READ)
        def _get(app, operation, request, principal=None, **kw):
            return do_get(service, principal, kw.get(id_param))

        g[f"{prefix}_get"] = _get


import uuid

from src.catalog.models import ClinicTreatment, Offer, OfferClinic, OfferTreatment, Treatment
from src.clinics.models import Clinic
from src.core.db import session_scope
from src.core.errors import NotFoundError


def _map_put(session, principal, Model, left_name, left_val, right_name, right_val, *, right_is_clinic):
    left = uuid.UUID(left_val)
    right = uuid.UUID(right_val)
    if right_is_clinic and not principal.can_access_clinic(right):
        raise NotFoundError("clinic not found")
    existing = session.get(Model, {left_name: left, right_name: right})
    if existing is None:
        session.add(Model(**{left_name: left, right_name: right}))
        session.flush()
    return {left_name: left_val, right_name: right_val}


def _map_delete(session, principal, Model, left_name, left_val, right_name, right_val, *, right_is_clinic):
    left = uuid.UUID(left_val)
    right = uuid.UUID(right_val)
    if right_is_clinic and not principal.can_access_clinic(right):
        raise NotFoundError("clinic not found")
    row = session.get(Model, {left_name: left, right_name: right})
    if row is not None:
        session.delete(row)
        session.flush()


@require_capability(CAP_CONTENT_WRITE)
def clinic_treatments_assign(app, operation, request, principal=None, clinic_id=None, treatment_id=None, **kw):
    with session_scope() as s:
        return _map_put(s, principal, ClinicTreatment, "clinic_id", clinic_id, "treatment_id", treatment_id, right_is_clinic=False), 200


@require_capability(CAP_CONTENT_WRITE)
def clinic_treatments_remove(app, operation, request, principal=None, clinic_id=None, treatment_id=None, **kw):
    with session_scope() as s:
        _map_delete(s, principal, ClinicTreatment, "clinic_id", clinic_id, "treatment_id", treatment_id, right_is_clinic=False)
        return {"status": "removed"}, 200


@require_capability(CAP_CONTENT_WRITE)
def offer_clinics_assign(app, operation, request, principal=None, offer_id=None, clinic_id=None, **kw):
    with session_scope() as s:
        return _map_put(s, principal, OfferClinic, "offer_id", offer_id, "clinic_id", clinic_id, right_is_clinic=True), 200


@require_capability(CAP_CONTENT_WRITE)
def offer_clinics_remove(app, operation, request, principal=None, offer_id=None, clinic_id=None, **kw):
    with session_scope() as s:
        _map_delete(s, principal, OfferClinic, "offer_id", offer_id, "clinic_id", clinic_id, right_is_clinic=True)
        return {"status": "removed"}, 200


@require_capability(CAP_CONTENT_WRITE)
def offer_treatments_assign(app, operation, request, principal=None, offer_id=None, treatment_id=None, **kw):
    with session_scope() as s:
        return _map_put(s, principal, OfferTreatment, "offer_id", offer_id, "treatment_id", treatment_id, right_is_clinic=False), 200


@require_capability(CAP_CONTENT_WRITE)
def offer_treatments_remove(app, operation, request, principal=None, offer_id=None, treatment_id=None, **kw):
    with session_scope() as s:
        _map_delete(s, principal, OfferTreatment, "offer_id", offer_id, "treatment_id", treatment_id, right_is_clinic=False)
        return {"status": "removed"}, 200


_crud("categories", CategoryService, CategoryCreate, CategoryUpdate, "category_id")
_crud("treatments", TreatmentService, TreatmentCreate, TreatmentUpdate, "treatment_id", has_get=True)
_crud("prices", PriceService, PriceCreate, PriceUpdate, "price_id")
_crud("treatment_faqs", TreatmentFaqService, TreatmentFaqCreate, TreatmentFaqUpdate, "faq_id")
_crud("offers", OfferService, OfferCreate, OfferUpdate, "offer_id", has_get=True)
_crud("offer_features", OfferFeatureService, OfferFeatureCreate, OfferFeatureUpdate, "feature_id")
_crud("technologies", TechnologyService, TechnologyCreate, TechnologyUpdate, "technology_id")
_crud("partners", PartnerService, PartnerCreate, PartnerUpdate, "partner_id")
