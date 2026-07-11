"""Admin CRUD handlers for clinics and their child resources + doctors."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import do_create, do_delete, do_get, do_list, do_update
from src.clinics.schemas import (
    ContactCreate,
    ContactUpdate,
    ClinicCreate,
    ClinicUpdate,
    DoctorCreate,
    DoctorUpdate,
    FaqCreate,
    FaqUpdate,
    HoursCreate,
    HoursUpdate,
    TransitCreate,
    TransitUpdate,
)
from src.clinics.service import (
    ClinicService,
    ContactService,
    DoctorService,
    FaqService,
    HoursService,
    TransitService,
    assign_doctor_clinic,
    remove_doctor_clinic,
)
from src.core.db import session_scope
from src.iam.capabilities import CAP_CONTENT_READ, CAP_CONTENT_WRITE
from src.iam.decorators import require_capability


# ── clinics ──────────────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def clinics_list(app, operation, request, principal=None, **kw):
    return do_list(ClinicService, principal)


@require_capability(CAP_CONTENT_READ)
def clinics_get(app, operation, request, principal=None, clinic_id=None, **kw):
    return do_get(ClinicService, principal, clinic_id)


@require_capability(CAP_CONTENT_WRITE)
def clinics_create(app, operation, request, principal=None, **kw):
    return do_create(ClinicService, ClinicCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def clinics_update(app, operation, request, principal=None, clinic_id=None, **kw):
    return do_update(ClinicService, ClinicUpdate, principal, clinic_id)


@require_capability(CAP_CONTENT_WRITE)
def clinics_delete(app, operation, request, principal=None, clinic_id=None, **kw):
    return do_delete(ClinicService, principal, clinic_id)


# ── clinic contacts ──────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def contacts_list(app, operation, request, principal=None, **kw):
    return do_list(ContactService, principal)


@require_capability(CAP_CONTENT_WRITE)
def contacts_create(app, operation, request, principal=None, **kw):
    return do_create(ContactService, ContactCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def contacts_update(app, operation, request, principal=None, contact_id=None, **kw):
    return do_update(ContactService, ContactUpdate, principal, contact_id)


@require_capability(CAP_CONTENT_WRITE)
def contacts_delete(app, operation, request, principal=None, contact_id=None, **kw):
    return do_delete(ContactService, principal, contact_id)


# ── clinic hours ─────────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def hours_list(app, operation, request, principal=None, **kw):
    return do_list(HoursService, principal)


@require_capability(CAP_CONTENT_WRITE)
def hours_create(app, operation, request, principal=None, **kw):
    return do_create(HoursService, HoursCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def hours_update(app, operation, request, principal=None, hours_id=None, **kw):
    return do_update(HoursService, HoursUpdate, principal, hours_id)


@require_capability(CAP_CONTENT_WRITE)
def hours_delete(app, operation, request, principal=None, hours_id=None, **kw):
    return do_delete(HoursService, principal, hours_id)


# ── clinic transit items ─────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def transit_list(app, operation, request, principal=None, **kw):
    return do_list(TransitService, principal)


@require_capability(CAP_CONTENT_WRITE)
def transit_create(app, operation, request, principal=None, **kw):
    return do_create(TransitService, TransitCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def transit_update(app, operation, request, principal=None, transit_id=None, **kw):
    return do_update(TransitService, TransitUpdate, principal, transit_id)


@require_capability(CAP_CONTENT_WRITE)
def transit_delete(app, operation, request, principal=None, transit_id=None, **kw):
    return do_delete(TransitService, principal, transit_id)


# ── clinic FAQs ──────────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def faqs_list(app, operation, request, principal=None, **kw):
    return do_list(FaqService, principal)


@require_capability(CAP_CONTENT_WRITE)
def faqs_create(app, operation, request, principal=None, **kw):
    return do_create(FaqService, FaqCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def faqs_update(app, operation, request, principal=None, faq_id=None, **kw):
    return do_update(FaqService, FaqUpdate, principal, faq_id)


@require_capability(CAP_CONTENT_WRITE)
def faqs_delete(app, operation, request, principal=None, faq_id=None, **kw):
    return do_delete(FaqService, principal, faq_id)


# ── doctors ──────────────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def doctors_list(app, operation, request, principal=None, **kw):
    return do_list(DoctorService, principal)


@require_capability(CAP_CONTENT_READ)
def doctors_get(app, operation, request, principal=None, doctor_id=None, **kw):
    return do_get(DoctorService, principal, doctor_id)


@require_capability(CAP_CONTENT_WRITE)
def doctors_create(app, operation, request, principal=None, **kw):
    return do_create(DoctorService, DoctorCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def doctors_update(app, operation, request, principal=None, doctor_id=None, **kw):
    return do_update(DoctorService, DoctorUpdate, principal, doctor_id)


@require_capability(CAP_CONTENT_WRITE)
def doctors_delete(app, operation, request, principal=None, doctor_id=None, **kw):
    return do_delete(DoctorService, principal, doctor_id)


# ── doctor ↔ clinic mapping ──────────────────────────────────────────────────
@require_capability(CAP_CONTENT_WRITE)
def doctor_clinics_assign(app, operation, request, principal=None, doctor_id=None, clinic_id=None, **kw):
    with session_scope() as session:
        return assign_doctor_clinic(session, principal, doctor_id, clinic_id), 200


@require_capability(CAP_CONTENT_WRITE)
def doctor_clinics_remove(app, operation, request, principal=None, doctor_id=None, clinic_id=None, **kw):
    with session_scope() as session:
        remove_doctor_clinic(session, principal, doctor_id, clinic_id)
        return {"status": "removed"}, 200
