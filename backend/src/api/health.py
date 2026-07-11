"""Health endpoints (anonymous).

qf dynamic-endpoint handler signature: ``(app, operation, request, **kwargs)``
returning ``(body, status)``.

  - ``health``    — service + build identity.
  - ``liveness``  — process is up.
  - ``readiness`` — PostgreSQL (Task 5) and the required MinIO bucket (Task 10).

At this scaffold stage no dependency probe is registered yet, so readiness reports
``not_ready`` (503). The public response never leaks dependency detail or DSNs.
"""
from __future__ import annotations

from src.config import Config


def health_check(app, operation, request, **kwargs):
    return {
        "status": "ok",
        "service": Config.SERVICE_NAME,
        "revision": Config.BUILD_REVISION,
    }, 200


def liveness(app, operation, request, **kwargs):
    return {"status": "alive"}, 200


def readiness(app, operation, request, **kwargs):
    # Dependency probes (PostgreSQL, MinIO bucket) are registered in Tasks 5 and 10.
    # Until then readiness is intentionally not-ready.
    return {"status": "not_ready"}, 503
