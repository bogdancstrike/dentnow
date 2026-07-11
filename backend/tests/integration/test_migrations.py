"""Schema/migration integration checks against a migrated PostgreSQL database."""
from __future__ import annotations

from datetime import timezone

from sqlalchemy import inspect, text

from src.audit.models import AuditEvent
from src.site.models import SiteLink

EXPECTED_TABLES = {
    "site_state", "site_links", "navigation_menus", "navigation_items",
    "pages", "page_sections", "page_seo", "site_publications",
    "preview_sessions", "audit_events",
    "integration_outbox", "integration_bindings", "integration_deliveries",
}


def test_all_slice1_tables_exist(db_engine):
    tables = set(inspect(db_engine).get_table_names())
    missing = EXPECTED_TABLES - tables
    assert not missing, f"missing tables: {missing}"


def test_alembic_is_at_head(db_engine):
    with db_engine.connect() as conn:
        version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    assert version == "0001"


def test_foreign_keys_are_indexed(db_engine):
    insp = inspect(db_engine)
    index_cols = {tuple(ix["column_names"]) for ix in insp.get_indexes("navigation_items")}
    for fk_col in ("menu_id", "parent_id", "target_page_id"):
        assert any(fk_col in cols for cols in index_cols), f"{fk_col} is not indexed"


def test_timestamps_are_timezone_aware_utc(db_session):
    link = SiteLink(kind="review", label="Google", value="https://maps.example/x")
    db_session.add(link)
    db_session.flush()
    db_session.refresh(link)
    assert link.created_at.tzinfo is not None
    assert link.created_at.utcoffset() == timezone.utc.utcoffset(None)


def test_audit_rows_insert(db_session):
    ev = AuditEvent(action="test.action", entity_type="site_link", entity_id="x")
    db_session.add(ev)
    db_session.flush()
    assert ev.id is not None


def test_singleton_site_state_constraint(db_session):
    from sqlalchemy.exc import IntegrityError
    from src.site.models import SiteState

    db_session.add(SiteState(id=1))
    db_session.flush()
    db_session.add(SiteState(id=2))  # violates ck_site_state_singleton
    try:
        db_session.flush()
        raised = False
    except IntegrityError:
        raised = True
    assert raised, "site_state must reject id != 1"
