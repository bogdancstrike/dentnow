"""Health endpoints (anonymous).

qf dynamic-endpoint handler signature: ``(app, operation, request, **kwargs)``
returning ``(body, status)``.

  - ``health``    — service + build identity.
  - ``liveness``  — process is up.
  - ``readiness`` — runs the registered dependency probes (PostgreSQL now; the
    mandatory MinIO bucket probe is added in Task 10). The public response is only a
    generic ready/not-ready and never leaks dependency detail or DSNs.
"""
from __future__ import annotations

from src.config import Config
from src.core.readiness import check_readiness


def health_check(app, operation, request, **kwargs):
    return {
        "status": "ok",
        "service": Config.SERVICE_NAME,
        "revision": Config.BUILD_REVISION,
    }, 200


def liveness(app, operation, request, **kwargs):
    return {"status": "alive"}, 200


def readiness(app, operation, request, **kwargs):
    ok, _details = check_readiness()  # details stay internal (logs/metrics only)
    if ok:
        return {"status": "ready"}, 200
    return {"status": "not_ready"}, 503
