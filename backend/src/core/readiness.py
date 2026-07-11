"""Dependency-probe registry for /api/readiness.

Readiness runs every registered probe; the PUBLIC response is only a generic
ready/not-ready, never dependency names, DSNs, or credentials. Task 5 registers the
PostgreSQL probe; Task 10 registers the mandatory MinIO bucket-stat probe.
"""
from __future__ import annotations

from typing import Callable

from sqlalchemy import text

_probes: dict[str, Callable[[], None]] = {}


def register_probe(name: str, fn: Callable[[], None]) -> None:
    _probes[name] = fn


def clear_probes() -> None:
    _probes.clear()


def check_readiness() -> tuple[bool, dict[str, bool]]:
    """Run every probe. Returns (all_ok, {name: ok}) — details are internal only."""
    ok = True
    details: dict[str, bool] = {}
    for name, fn in list(_probes.items()):
        try:
            fn()
            details[name] = True
        except Exception:
            details[name] = False
            ok = False
    return (ok and bool(_probes)), details


def _postgres_probe() -> None:
    from src.core.db import get_engine

    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))


def register_default_probes() -> None:
    register_probe("postgres", _postgres_probe)


register_default_probes()
