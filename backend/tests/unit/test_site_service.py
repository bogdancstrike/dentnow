"""Site/navigation/page service tests (DB-backed, rolled back)."""
from __future__ import annotations

import pytest

from src.core.errors import ConflictError, ValidationError
from src.iam.capabilities import ROLE_ADMIN
from src.iam.principal import Principal
from src.site.service import (
    MenuService,
    NavItemService,
    PageService,
    SiteSettingsService,
)

ADMIN = Principal(subject="admin", roles=frozenset({ROLE_ADMIN}))


def test_site_settings_singleton_update(db_session):
    svc = SiteSettingsService(db_session, ADMIN)
    out = svc.update({"site_name": "DentNow București"})
    assert out["site_name"] == "DentNow București"
    assert out["id"] == 1
    # A second update mutates the same singleton row.
    out2 = svc.update({"default_locale": "ro-RO"})
    assert out2["id"] == 1


def test_page_unique_path(db_session):
    svc = PageService(db_session, ADMIN)
    svc.create({"path": "/tratamente", "route_key": "treatments", "template_key": "treatment-index", "title": "Tratamente"})
    with pytest.raises(ConflictError):
        svc.create({"path": "/tratamente", "route_key": "treatments-2", "template_key": "generic", "title": "Dup"})


def _make_page(db_session, path="/p", key="k"):
    return PageService(db_session, ADMIN).create(
        {"path": path, "route_key": key, "template_key": "generic", "title": "P"}
    )[0]


def test_nav_item_rejects_missing_target(db_session):
    menu = MenuService(db_session, ADMIN).create({"key": "desktop", "label": "Desktop"})[0]
    svc = NavItemService(db_session, ADMIN)
    with pytest.raises(ValidationError):
        svc.create({"menu_id": menu["id"], "label": "Bad"})  # no page and no url


def test_nav_item_rejects_nonexistent_page(db_session):
    menu = MenuService(db_session, ADMIN).create({"key": "desktop", "label": "Desktop"})[0]
    import uuid

    svc = NavItemService(db_session, ADMIN)
    with pytest.raises(ValidationError):
        svc.create({"menu_id": menu["id"], "label": "Ghost", "target_page_id": str(uuid.uuid4())})


def test_nav_item_accepts_valid_page_target(db_session):
    menu = MenuService(db_session, ADMIN).create({"key": "desktop", "label": "Desktop"})[0]
    page = _make_page(db_session, "/home", "home")
    svc = NavItemService(db_session, ADMIN)
    item, etag = svc.create({"menu_id": menu["id"], "label": "Home", "target_page_id": page["id"]})
    assert item["target_page_id"] == page["id"]
    assert etag == '"1"'


def test_nav_item_prevents_parent_cycle(db_session):
    menu = MenuService(db_session, ADMIN).create({"key": "m", "label": "M"})[0]
    svc = NavItemService(db_session, ADMIN)
    a, ea = svc.create({"menu_id": menu["id"], "label": "A", "external_url": "https://x.example"})
    b, eb = svc.create({"menu_id": menu["id"], "label": "B", "external_url": "https://y.example", "parent_id": a["id"]})
    # Make A a child of B -> would form a cycle A->B->A.
    with pytest.raises(ValidationError):
        svc.update(a["id"], {"parent_id": b["id"]}, ea)
