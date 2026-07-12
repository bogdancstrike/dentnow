"""Site/navigation/page services (extend the shared CrudService)."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select

from src.core.clock import utcnow
from src.core.correlation import get_correlation_id
from src.core.crud import CrudService
from src.core.errors import ConflictError, NotFoundError, ValidationError
from src.audit.service import write_audit
from src.integrations.outbox import enqueue_event
from src.site.models import (
    CasFaq,
    CasStep,
    GalleryImage,
    HomepageService,
    NavigationItem,
    NavigationMenu,
    Page,
    PageSection,
    PageSeo,
    SiteLink,
    SiteState,
)
from src.site.serializers import (
    serialize_cas_faq,
    serialize_cas_step,
    serialize_gallery_image,
    serialize_homepage_service,
    serialize_link,
    serialize_menu,
    serialize_nav_item,
    serialize_page,
    serialize_section,
    serialize_seo,
    serialize_site_state,
)
from src.site.workspace import bump_workspace_version


class SiteSettingsService:
    """Singleton site settings — update-only, no create/delete."""

    def __init__(self, session, principal):
        self.session = session
        self.principal = principal

    def _state(self) -> SiteState:
        state = self.session.get(SiteState, 1)
        if state is None:
            state = SiteState(id=1)
            self.session.add(state)
            self.session.flush()
        return state

    def get(self) -> dict:
        return serialize_site_state(self._state())

    def update(self, data: dict) -> dict:
        cid = get_correlation_id()
        state = self._state()
        before = serialize_site_state(state)
        for key, value in data.items():
            setattr(state, key, value)
        self.session.flush()
        after = serialize_site_state(state)
        write_audit(
            self.session, action="site.update", entity_type="site_state", entity_id=1,
            principal=self.principal, before=before, after=after, correlation_id=cid,
        )
        enqueue_event(
            self.session, event_type="site.updated.v1", aggregate_type="site_state",
            aggregate_id="1", payload={}, correlation_id=cid,
        )
        bump_workspace_version(self.session)
        return after


class HomepageServiceService(CrudService):
    model = HomepageService
    entity_type = "homepage_service"
    event_prefix = "homepage_service"
    sortable = ("position", "title", "created_at")
    search_columns = ("title", "description")

    def serialize(self, obj: Any) -> dict:
        return serialize_homepage_service(obj)


class CasStepService(CrudService):
    model = CasStep
    entity_type = "cas_step"
    event_prefix = "cas_step"
    sortable = ("position", "title", "created_at")
    search_columns = ("title", "text")

    def serialize(self, obj: Any) -> dict:
        return serialize_cas_step(obj)


class CasFaqService(CrudService):
    model = CasFaq
    entity_type = "cas_faq"
    event_prefix = "cas_faq"
    sortable = ("position", "created_at")
    search_columns = ("question", "answer")

    def serialize(self, obj: Any) -> dict:
        return serialize_cas_faq(obj)


class GalleryImageService(CrudService):
    model = GalleryImage
    entity_type = "gallery_image"
    event_prefix = "gallery_image"
    sortable = ("position", "title", "created_at")
    search_columns = ("title", "caption")

    def serialize(self, obj: Any) -> dict:
        return serialize_gallery_image(obj)

    @staticmethod
    def _coerce_media(data: dict) -> dict:
        data = dict(data)
        if "media_id" in data:
            data["media_id"] = uuid.UUID(str(data["media_id"])) if data["media_id"] else None
        return data

    def to_create_kwargs(self, data: dict) -> dict:
        return self._coerce_media(data)

    def to_update_values(self, data: dict, obj: Any) -> dict:
        return self._coerce_media(data)


class LinkService(CrudService):
    model = SiteLink
    entity_type = "site_link"
    event_prefix = "site_link"
    sortable = ("position", "created_at", "kind")
    search_columns = ("label", "value")

    def serialize(self, obj: Any) -> dict:
        return serialize_link(obj)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        q = select(SiteLink.id).where(
            SiteLink.kind == obj.kind, SiteLink.label == obj.label, SiteLink.deleted_at.is_(None)
        )
        if not creating:
            q = q.where(SiteLink.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("a link with this kind and label already exists")


class MenuService(CrudService):
    model = NavigationMenu
    entity_type = "navigation_menu"
    event_prefix = "navigation"
    sortable = ("key", "created_at")
    search_columns = ("key", "label")

    def serialize(self, obj: Any) -> dict:
        return serialize_menu(obj)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        q = select(NavigationMenu.id).where(
            NavigationMenu.key == obj.key, NavigationMenu.deleted_at.is_(None)
        )
        if not creating:
            q = q.where(NavigationMenu.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("menu key already in use", details={"field": "key"})


class NavItemService(CrudService):
    model = NavigationItem
    entity_type = "navigation_item"
    event_prefix = "navigation"
    sortable = ("position", "created_at")
    search_columns = ("label",)

    def serialize(self, obj: Any) -> dict:
        return serialize_nav_item(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        data = dict(data)
        data["menu_id"] = uuid.UUID(str(data["menu_id"]))
        for fk in ("parent_id", "target_page_id"):
            if data.get(fk):
                data[fk] = uuid.UUID(str(data[fk]))
        return data

    def to_update_values(self, data: dict, obj: Any) -> dict:
        data = dict(data)
        for fk in ("parent_id", "target_page_id"):
            if fk in data and data[fk]:
                data[fk] = uuid.UUID(str(data[fk]))
        return data

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        # Exactly one target: an internal page or an external URL.
        if not obj.target_page_id and not obj.external_url:
            raise ValidationError("nav item needs a target page or external url")
        if obj.target_page_id:
            page = self.session.get(Page, obj.target_page_id)
            if page is None or page.deleted_at is not None:
                raise ValidationError("target page does not exist", details={"field": "target_page_id"})
        # Prevent parent cycles.
        if obj.parent_id:
            seen = {obj.id}
            cursor = self.session.get(NavigationItem, obj.parent_id)
            while cursor is not None:
                if cursor.id in seen:
                    raise ValidationError("navigation cycle detected")
                seen.add(cursor.id)
                cursor = self.session.get(NavigationItem, cursor.parent_id) if cursor.parent_id else None


class PageService(CrudService):
    model = Page
    entity_type = "page"
    event_prefix = "page"
    sortable = ("path", "route_key", "created_at", "template_key")
    search_columns = ("path", "route_key", "title")

    def serialize(self, obj: Any) -> dict:
        return serialize_page(obj)

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        for field in ("path", "route_key"):
            q = select(Page.id).where(
                getattr(Page, field) == getattr(obj, field), Page.deleted_at.is_(None)
            )
            if not creating:
                q = q.where(Page.id != obj.id)
            if self.session.scalar(q) is not None:
                raise ConflictError(f"page {field} already in use", details={"field": field})

    def check_deletable(self, obj: Any) -> None:
        ref = self.session.scalar(
            select(NavigationItem.id).where(
                NavigationItem.target_page_id == obj.id, NavigationItem.deleted_at.is_(None)
            ).limit(1)
        )
        if ref is not None:
            raise ConflictError("page is referenced by a navigation item")


class SectionService(CrudService):
    model = PageSection
    entity_type = "page_section"
    event_prefix = "page"
    sortable = ("position", "created_at")

    def serialize(self, obj: Any) -> dict:
        return serialize_section(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        data = dict(data)
        data["page_id"] = uuid.UUID(str(data["page_id"]))
        return data


class SeoService(CrudService):
    model = PageSeo
    entity_type = "page_seo"
    event_prefix = "page"
    sortable = ("created_at",)

    def serialize(self, obj: Any) -> dict:
        return serialize_seo(obj)

    def to_create_kwargs(self, data: dict) -> dict:
        data = dict(data)
        data["page_id"] = uuid.UUID(str(data["page_id"]))
        return data

    def before_write(self, obj: Any, data: dict, *, creating: bool) -> None:
        q = select(PageSeo.id).where(
            PageSeo.page_id == obj.page_id, PageSeo.deleted_at.is_(None)
        )
        if not creating:
            q = q.where(PageSeo.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("page already has SEO metadata", details={"field": "page_id"})
