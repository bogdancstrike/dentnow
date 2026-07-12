"""Catalog serializers. Prices expose NUMERIC + currency + kind (never a formatted
string); the frontend formats for its locale.
"""
from __future__ import annotations

from typing import Any


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


def _num(v) -> float | None:
    return float(v) if v is not None else None


def _base(o: Any) -> dict:
    return {"id": str(o.id), "version": o.version, "created_at": _iso(o.created_at), "updated_at": _iso(o.updated_at)}


def serialize_category(o: Any) -> dict:
    return {**_base(o), "slug": o.slug, "label": o.label, "description": o.description, "position": o.position}


def serialize_treatment(o: Any) -> dict:
    return {
        **_base(o),
        "category_id": str(o.category_id) if o.category_id else None,
        "slug": o.slug, "name": o.name, "summary": o.summary,
        "detail_markdown": o.detail_markdown, "duration": o.duration,
        "visits": o.visits, "anesthesia": o.anesthesia, "active": o.active,
        "homepage_featured": o.homepage_featured, "homepage_label": o.homepage_label,
        "homepage_icon": o.homepage_icon, "position": o.position,
    }


def serialize_price(o: Any) -> dict:
    return {
        **_base(o),
        "treatment_id": str(o.treatment_id),
        "clinic_id": str(o.clinic_id) if o.clinic_id else None,
        "price_kind": o.price_kind, "amount": _num(o.amount), "amount_max": _num(o.amount_max),
        "old_amount": _num(o.old_amount), "currency": o.currency, "note": o.note, "position": o.position,
    }


def serialize_treatment_faq(o: Any) -> dict:
    return {**_base(o), "treatment_id": str(o.treatment_id), "question": o.question, "answer": o.answer, "position": o.position}


def serialize_offer(o: Any) -> dict:
    return {
        **_base(o),
        "slug": o.slug, "name": o.name, "summary": o.summary, "badge": o.badge,
        "price_amount": _num(o.price_amount), "old_amount": _num(o.old_amount), "currency": o.currency,
        "starts_at": o.starts_at, "ends_at": o.ends_at, "status": o.status,
        "featured": o.featured, "position": o.position,
    }


def serialize_offer_feature(o: Any) -> dict:
    return {**_base(o), "offer_id": str(o.offer_id), "label": o.label, "position": o.position}


def serialize_technology(o: Any) -> dict:
    return {
        **_base(o), "name": o.name, "description": o.description,
        "media_id": str(o.media_id) if o.media_id else None, "active": o.active, "position": o.position,
    }


def serialize_partner(o: Any) -> dict:
    return {
        **_base(o), "name": o.name, "relationship_type": o.relationship_type, "badge": o.badge,
        "logo_media_id": str(o.logo_media_id) if o.logo_media_id else None,
        "rights_note": o.rights_note, "link_url": o.link_url, "active": o.active, "position": o.position,
    }
