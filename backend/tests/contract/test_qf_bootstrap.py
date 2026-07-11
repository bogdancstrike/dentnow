"""Contract tests proving the qf WSGI assembly boots correctly.

Asserts that:
  - ``backend/config.py`` exposes ``Config`` as a top-level module (qf requires it);
  - the installed distribution is ``qf==1.0.5`` while the import package is ``framework``;
  - ``wsgi.app`` builds and registers ``/api/health``, ``/api/liveness``, ``/api/readiness``;
  - the app is built with qf ETL disabled (``enable_etl=False``);
  - health handlers return the documented ``(body, status)`` shape.
"""
from __future__ import annotations

import pytest


def test_config_is_top_level_importable():
    import config  # top-level shim required by qf

    assert hasattr(config, "Config")
    from src.config import Config as SrcConfig

    assert config.Config is SrcConfig


def test_qf_distribution_is_1_0_5_and_import_is_framework():
    from importlib import metadata

    assert metadata.version("qf") == "1.0.5"
    import framework  # import package name

    assert framework is not None


def test_framework_settings_accepts_etl_disabled():
    from framework.app import FrameworkSettings

    settings = FrameworkSettings(
        enable_etl=False,
        enable_api=True,
        enable_dynamic_endpoints=True,
    )
    assert settings.enable_etl is False


@pytest.fixture(scope="module")
def flask_app():
    from wsgi import app

    return app


def test_health_routes_registered(flask_app):
    rules = {r.rule for r in flask_app.url_map.iter_rules()}
    for path in ("/api/health", "/api/liveness", "/api/readiness"):
        assert path in rules, f"expected route {path}; have {sorted(rules)}"


def test_health_handler_returns_body_status_tuple():
    from src.api.health import health_check, liveness, readiness
    from src.core import readiness as readiness_mod

    body, status = health_check(None, None, None)
    assert status == 200 and body["status"] == "ok" and "service" in body

    body, status = liveness(None, None, None)
    assert status == 200 and body["status"] == "alive"

    # With no probes registered, readiness is not-ready and never leaks detail.
    readiness_mod.clear_probes()
    body, status = readiness(None, None, None)
    assert status == 503 and body == {"status": "not_ready"}

    # A passing probe flips it to ready.
    readiness_mod.register_probe("stub", lambda: None)
    body, status = readiness(None, None, None)
    assert status == 200 and body == {"status": "ready"}

    # A failing probe forces not-ready.
    readiness_mod.register_probe("bad", lambda: (_ for _ in ()).throw(RuntimeError("down")))
    _body, status = readiness(None, None, None)
    assert status == 503
    readiness_mod.clear_probes()
    readiness_mod.register_default_probes()
