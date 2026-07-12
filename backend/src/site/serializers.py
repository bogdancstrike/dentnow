"""Site/navigation/page serializers."""
from __future__ import annotations

from typing import Any


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


def serialize_site_state(s: Any) -> dict:
    return {
        "id": s.id,
        "site_name": s.site_name,
        "default_locale": s.default_locale,
        "default_timezone": s.default_timezone,
        "workspace_version": s.workspace_version,
        "active_publication_id": str(s.active_publication_id) if s.active_publication_id else None,
        "updated_at": _iso(s.updated_at),
    }


def serialize_homepage_service(s: Any) -> dict:
    return {
        "id": str(s.id),
        "version": s.version,
        "title": s.title,
        "description": s.description,
        "icon": s.icon,
        "link": s.link,
        "position": s.position,
        "active": s.active,
        "created_at": _iso(s.created_at),
        "updated_at": _iso(s.updated_at),
    }


def serialize_link(link: Any) -> dict:
    return {
        "id": str(link.id),
        "version": link.version,
        "kind": link.kind,
        "label": link.label,
        "value": link.value,
        "display_value": link.display_value,
        "url": link.url,
        "position": link.position,
        "enabled": link.enabled,
        "created_at": _iso(link.created_at),
        "updated_at": _iso(link.updated_at),
    }


def serialize_menu(m: Any) -> dict:
    return {
        "id": str(m.id),
        "version": m.version,
        "key": m.key,
        "label": m.label,
        "created_at": _iso(m.created_at),
        "updated_at": _iso(m.updated_at),
    }


def serialize_nav_item(i: Any) -> dict:
    return {
        "id": str(i.id),
        "version": i.version,
        "menu_id": str(i.menu_id),
        "parent_id": str(i.parent_id) if i.parent_id else None,
        "label": i.label,
        "target_page_id": str(i.target_page_id) if i.target_page_id else None,
        "external_url": i.external_url,
        "position": i.position,
        "enabled": i.enabled,
        "created_at": _iso(i.created_at),
        "updated_at": _iso(i.updated_at),
    }


def serialize_page(p: Any) -> dict:
    return {
        "id": str(p.id),
        "version": p.version,
        "path": p.path,
        "route_key": p.route_key,
        "template_key": p.template_key,
        "title": p.title,
        "enabled": p.enabled,
        "indexable": p.indexable,
        "created_at": _iso(p.created_at),
        "updated_at": _iso(p.updated_at),
    }


def serialize_section(s: Any) -> dict:
    return {
        "id": str(s.id),
        "version": s.version,
        "page_id": str(s.page_id),
        "position": s.position,
        "block_type": s.block_type,
        "payload": s.payload,
        "created_at": _iso(s.created_at),
        "updated_at": _iso(s.updated_at),
    }


def serialize_seo(s: Any) -> dict:
    return {
        "id": str(s.id),
        "version": s.version,
        "page_id": str(s.page_id),
        "title": s.title,
        "description": s.description,
        "canonical_path": s.canonical_path,
        "og_media_id": str(s.og_media_id) if s.og_media_id else None,
        "structured_data": s.structured_data,
        "created_at": _iso(s.created_at),
        "updated_at": _iso(s.updated_at),
    }
