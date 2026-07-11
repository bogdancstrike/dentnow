"""Serializers: stable API field names, ISO timestamps, never ORM instances."""
from __future__ import annotations

from typing import Any


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


def _time(t) -> str | None:
    return t.isoformat() if t else None


def serialize_clinic(c: Any) -> dict:
    return {
        "id": str(c.id),
        "version": c.version,
        "slug": c.slug,
        "name": c.name,
        "area": c.area,
        "address_line": c.address_line,
        "address_detail": c.address_detail,
        "address_full": c.address_full,
        "postal_code": c.postal_code,
        "latitude": float(c.latitude) if c.latitude is not None else None,
        "longitude": float(c.longitude) if c.longitude is not None else None,
        "map_embed_url": c.map_embed_url,
        "map_link_url": c.map_link_url,
        "status": c.status,
        "position": c.position,
        "created_at": _iso(c.created_at),
        "updated_at": _iso(c.updated_at),
    }


def serialize_contact(c: Any) -> dict:
    return {
        "id": str(c.id),
        "version": c.version,
        "clinic_id": str(c.clinic_id),
        "kind": c.kind,
        "display_value": c.display_value,
        "normalized_value": c.normalized_value,
        "url": c.url,
        "label": c.label,
        "position": c.position,
        "is_primary": c.is_primary,
        "created_at": _iso(c.created_at),
        "updated_at": _iso(c.updated_at),
    }


def serialize_hours(h: Any) -> dict:
    return {
        "id": str(h.id),
        "version": h.version,
        "clinic_id": str(h.clinic_id),
        "weekday": h.weekday,
        "opens_at": _time(h.opens_at),
        "closes_at": _time(h.closes_at),
        "closed": h.closed,
        "created_at": _iso(h.created_at),
        "updated_at": _iso(h.updated_at),
    }


def serialize_transit(t: Any) -> dict:
    return {
        "id": str(t.id),
        "version": t.version,
        "clinic_id": str(t.clinic_id),
        "mode": t.mode,
        "label": t.label,
        "detail": t.detail,
        "position": t.position,
        "created_at": _iso(t.created_at),
        "updated_at": _iso(t.updated_at),
    }


def serialize_faq(f: Any) -> dict:
    return {
        "id": str(f.id),
        "version": f.version,
        "clinic_id": str(f.clinic_id),
        "question": f.question,
        "answer": f.answer,
        "position": f.position,
        "created_at": _iso(f.created_at),
        "updated_at": _iso(f.updated_at),
    }


def serialize_doctor(d: Any) -> dict:
    return {
        "id": str(d.id),
        "version": d.version,
        "slug": d.slug,
        "name": d.name,
        "role": d.role,
        "focus": d.focus,
        "credentials": d.credentials,
        "portrait_media_id": str(d.portrait_media_id) if d.portrait_media_id else None,
        "active": d.active,
        "position": d.position,
        "created_at": _iso(d.created_at),
        "updated_at": _iso(d.updated_at),
    }
