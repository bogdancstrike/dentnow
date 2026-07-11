"""Admin handlers for site settings, links, navigation, pages, sections, SEO."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import _json, _validate, do_create, do_delete, do_get, do_list, do_update
from src.core.db import session_scope
from src.iam.capabilities import CAP_CONTENT_READ, CAP_CONTENT_WRITE
from src.iam.decorators import require_capability
from src.site.schemas import (
    LinkCreate,
    LinkUpdate,
    MenuCreate,
    MenuUpdate,
    NavItemCreate,
    NavItemUpdate,
    PageCreate,
    PageUpdate,
    SectionCreate,
    SectionUpdate,
    SeoCreate,
    SeoUpdate,
    SiteSettingsUpdate,
)
from src.site.service import (
    LinkService,
    MenuService,
    NavItemService,
    PageService,
    SectionService,
    SeoService,
    SiteSettingsService,
)


# ── site settings (singleton) ────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def site_get(app, operation, request, principal=None, **kw):
    with session_scope() as session:
        return _json(SiteSettingsService(session, principal).get(), 200)


@require_capability(CAP_CONTENT_WRITE)
def site_update(app, operation, request, principal=None, **kw):
    payload = _validate(SiteSettingsUpdate, flask_request.get_json(silent=True))
    with session_scope() as session:
        return _json(SiteSettingsService(session, principal).update(payload), 200)


# ── links ────────────────────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def links_list(app, operation, request, principal=None, **kw):
    return do_list(LinkService, principal)


@require_capability(CAP_CONTENT_WRITE)
def links_create(app, operation, request, principal=None, **kw):
    return do_create(LinkService, LinkCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def links_update(app, operation, request, principal=None, link_id=None, **kw):
    return do_update(LinkService, LinkUpdate, principal, link_id)


@require_capability(CAP_CONTENT_WRITE)
def links_delete(app, operation, request, principal=None, link_id=None, **kw):
    return do_delete(LinkService, principal, link_id)


# ── navigation menus + items ─────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def menus_list(app, operation, request, principal=None, **kw):
    return do_list(MenuService, principal)


@require_capability(CAP_CONTENT_WRITE)
def menus_create(app, operation, request, principal=None, **kw):
    return do_create(MenuService, MenuCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def menus_update(app, operation, request, principal=None, menu_id=None, **kw):
    return do_update(MenuService, MenuUpdate, principal, menu_id)


@require_capability(CAP_CONTENT_WRITE)
def menus_delete(app, operation, request, principal=None, menu_id=None, **kw):
    return do_delete(MenuService, principal, menu_id)


@require_capability(CAP_CONTENT_READ)
def nav_items_list(app, operation, request, principal=None, **kw):
    return do_list(NavItemService, principal)


@require_capability(CAP_CONTENT_WRITE)
def nav_items_create(app, operation, request, principal=None, **kw):
    return do_create(NavItemService, NavItemCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def nav_items_update(app, operation, request, principal=None, item_id=None, **kw):
    return do_update(NavItemService, NavItemUpdate, principal, item_id)


@require_capability(CAP_CONTENT_WRITE)
def nav_items_delete(app, operation, request, principal=None, item_id=None, **kw):
    return do_delete(NavItemService, principal, item_id)


# ── pages, sections, SEO ─────────────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def pages_list(app, operation, request, principal=None, **kw):
    return do_list(PageService, principal)


@require_capability(CAP_CONTENT_READ)
def pages_get(app, operation, request, principal=None, page_id=None, **kw):
    return do_get(PageService, principal, page_id)


@require_capability(CAP_CONTENT_WRITE)
def pages_create(app, operation, request, principal=None, **kw):
    return do_create(PageService, PageCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def pages_update(app, operation, request, principal=None, page_id=None, **kw):
    return do_update(PageService, PageUpdate, principal, page_id)


@require_capability(CAP_CONTENT_WRITE)
def pages_delete(app, operation, request, principal=None, page_id=None, **kw):
    return do_delete(PageService, principal, page_id)


@require_capability(CAP_CONTENT_READ)
def sections_list(app, operation, request, principal=None, **kw):
    return do_list(SectionService, principal)


@require_capability(CAP_CONTENT_WRITE)
def sections_create(app, operation, request, principal=None, **kw):
    return do_create(SectionService, SectionCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def sections_update(app, operation, request, principal=None, section_id=None, **kw):
    return do_update(SectionService, SectionUpdate, principal, section_id)


@require_capability(CAP_CONTENT_WRITE)
def sections_delete(app, operation, request, principal=None, section_id=None, **kw):
    return do_delete(SectionService, principal, section_id)


@require_capability(CAP_CONTENT_READ)
def seo_list(app, operation, request, principal=None, **kw):
    return do_list(SeoService, principal)


@require_capability(CAP_CONTENT_WRITE)
def seo_create(app, operation, request, principal=None, **kw):
    return do_create(SeoService, SeoCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def seo_update(app, operation, request, principal=None, seo_id=None, **kw):
    return do_update(SeoService, SeoUpdate, principal, seo_id)


@require_capability(CAP_CONTENT_WRITE)
def seo_delete(app, operation, request, principal=None, seo_id=None, **kw):
    return do_delete(SeoService, principal, seo_id)
