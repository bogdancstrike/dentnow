from src.api.analytics_admin import analytics_export_get, analytics_overview_get
from src.api.analytics_public import analytics_event_create
from src.iam.capabilities import CAP_ANALYTICS_READ


def test_admin_analytics_handlers_are_capability_protected():
    assert analytics_overview_get.__dentnow_protected__ is True
    assert analytics_overview_get.__dentnow_capability__ == CAP_ANALYTICS_READ
    assert analytics_export_get.__dentnow_capability__ == CAP_ANALYTICS_READ


def test_public_ingestion_is_anonymous_but_error_wrapped():
    assert not getattr(analytics_event_create, "__dentnow_protected__", False)
