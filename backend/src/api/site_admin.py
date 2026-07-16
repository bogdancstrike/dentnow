"""Admin handlers for site settings, links, navigation, pages, sections, SEO."""
from __future__ import annotations

from flask import request as flask_request

from src.api._helpers import _json, _validate, do_create, do_delete, do_get, do_list, do_update
from src.core.db import session_scope
from src.iam.capabilities import CAP_CONTENT_READ, CAP_CONTENT_WRITE
from src.iam.decorators import require_capability
from src.site.schemas import (
    CasFaqCreate,
    CasFaqUpdate,
    CasStepCreate,
    CasStepUpdate,
    GalleryImageCreate,
    GalleryImageUpdate,
    HomepageServiceCreate,
    HomepageServiceUpdate,
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
    SiteTextCreate,
    SiteTextUpdate,
)
from src.site.service import (
    CasFaqService,
    CasStepService,
    GalleryImageService,
    HomepageServiceService,
    LinkService,
    MenuService,
    NavItemService,
    PageService,
    SectionService,
    SeoService,
    SiteSettingsService,
    SiteTextService,
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


# ── homepage services (Tratamente uzuale cards) ──────────────────────────────
@require_capability(CAP_CONTENT_READ)
def homepage_services_list(app, operation, request, principal=None, **kw):
    return do_list(HomepageServiceService, principal)


@require_capability(CAP_CONTENT_READ)
def homepage_services_get(app, operation, request, principal=None, service_id=None, **kw):
    return do_get(HomepageServiceService, principal, service_id)


@require_capability(CAP_CONTENT_WRITE)
def homepage_services_create(app, operation, request, principal=None, **kw):
    return do_create(HomepageServiceService, HomepageServiceCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def homepage_services_update(app, operation, request, principal=None, service_id=None, **kw):
    return do_update(HomepageServiceService, HomepageServiceUpdate, principal, service_id)


@require_capability(CAP_CONTENT_WRITE)
def homepage_services_delete(app, operation, request, principal=None, service_id=None, **kw):
    return do_delete(HomepageServiceService, principal, service_id)


# ── site texts (overrides for hardcoded public copy) ─────────────────────────
@require_capability(CAP_CONTENT_READ)
def site_texts_list(app, operation, request, principal=None, **kw):
    return do_list(SiteTextService, principal)


@require_capability(CAP_CONTENT_READ)
def site_texts_get(app, operation, request, principal=None, text_id=None, **kw):
    return do_get(SiteTextService, principal, text_id)


@require_capability(CAP_CONTENT_WRITE)
def site_texts_create(app, operation, request, principal=None, **kw):
    return do_create(SiteTextService, SiteTextCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def site_texts_update(app, operation, request, principal=None, text_id=None, **kw):
    return do_update(SiteTextService, SiteTextUpdate, principal, text_id)


@require_capability(CAP_CONTENT_WRITE)
def site_texts_delete(app, operation, request, principal=None, text_id=None, **kw):
    return do_delete(SiteTextService, principal, text_id)


# ── decontat CAS: steps + faqs ───────────────────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def cas_steps_list(app, operation, request, principal=None, **kw):
    return do_list(CasStepService, principal)


@require_capability(CAP_CONTENT_READ)
def cas_steps_get(app, operation, request, principal=None, step_id=None, **kw):
    return do_get(CasStepService, principal, step_id)


@require_capability(CAP_CONTENT_WRITE)
def cas_steps_create(app, operation, request, principal=None, **kw):
    return do_create(CasStepService, CasStepCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def cas_steps_update(app, operation, request, principal=None, step_id=None, **kw):
    return do_update(CasStepService, CasStepUpdate, principal, step_id)


@require_capability(CAP_CONTENT_WRITE)
def cas_steps_delete(app, operation, request, principal=None, step_id=None, **kw):
    return do_delete(CasStepService, principal, step_id)


@require_capability(CAP_CONTENT_READ)
def cas_faqs_list(app, operation, request, principal=None, **kw):
    return do_list(CasFaqService, principal)


@require_capability(CAP_CONTENT_READ)
def cas_faqs_get(app, operation, request, principal=None, faq_id=None, **kw):
    return do_get(CasFaqService, principal, faq_id)


@require_capability(CAP_CONTENT_WRITE)
def cas_faqs_create(app, operation, request, principal=None, **kw):
    return do_create(CasFaqService, CasFaqCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def cas_faqs_update(app, operation, request, principal=None, faq_id=None, **kw):
    return do_update(CasFaqService, CasFaqUpdate, principal, faq_id)


@require_capability(CAP_CONTENT_WRITE)
def cas_faqs_delete(app, operation, request, principal=None, faq_id=None, **kw):
    return do_delete(CasFaqService, principal, faq_id)


# ── gallery images (clinic space carousel) ───────────────────────────────────
@require_capability(CAP_CONTENT_READ)
def gallery_images_list(app, operation, request, principal=None, **kw):
    return do_list(GalleryImageService, principal)


@require_capability(CAP_CONTENT_READ)
def gallery_images_get(app, operation, request, principal=None, image_id=None, **kw):
    return do_get(GalleryImageService, principal, image_id)


@require_capability(CAP_CONTENT_WRITE)
def gallery_images_create(app, operation, request, principal=None, **kw):
    return do_create(GalleryImageService, GalleryImageCreate, principal)


@require_capability(CAP_CONTENT_WRITE)
def gallery_images_update(app, operation, request, principal=None, image_id=None, **kw):
    return do_update(GalleryImageService, GalleryImageUpdate, principal, image_id)


@require_capability(CAP_CONTENT_WRITE)
def gallery_images_delete(app, operation, request, principal=None, image_id=None, **kw):
    return do_delete(GalleryImageService, principal, image_id)


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
