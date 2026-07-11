"""Contract tests for the qf endpoint map shape.

qf requires ``namespaces``, ``models``, and ``endpoints``; ``request_method`` is a
list; and every ``exec_method`` target must import and expose its handler with the
exact ``(app, operation, request, **kwargs)`` signature.
"""
from __future__ import annotations

import importlib
import inspect
import json
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENDPOINT_MAP = BACKEND_DIR / "maps" / "endpoint.json"


@pytest.fixture(scope="module")
def endpoint_map() -> dict:
    return json.loads(ENDPOINT_MAP.read_text(encoding="utf-8"))


def test_map_has_required_top_level_keys(endpoint_map):
    for key in ("namespaces", "models", "endpoints"):
        assert key in endpoint_map, f"endpoint map missing '{key}'"
    assert endpoint_map["namespaces"], "at least one namespace is required"
    assert "Empty" in endpoint_map["models"], "an Empty model is required"


def test_namespace_is_api(endpoint_map):
    names = {ns["name"] for ns in endpoint_map["namespaces"]}
    assert "api" in names, "the DentNow namespace must be 'api' (=> /api/... routes)"


def test_request_method_is_always_a_list(endpoint_map):
    for ep in endpoint_map["endpoints"]:
        assert isinstance(ep["request_method"], list), (
            f"request_method must be a list for {ep['operation_name']}"
        )
        assert ep["request_method"], "request_method must be non-empty"


def test_every_exec_target_imports_with_correct_signature(endpoint_map):
    for ep in endpoint_map["endpoints"]:
        target = ep["exec_method"]
        module = importlib.import_module(target["module_name"])
        handler = getattr(module, target["method_name"], None)
        assert handler is not None, (
            f"{target['module_name']}.{target['method_name']} does not exist"
        )
        params = list(inspect.signature(handler).parameters)
        assert params[:3] == ["app", "operation", "request"], (
            f"{target['method_name']} must accept (app, operation, request, **kwargs); "
            f"got {params}"
        )
        assert any(
            p.kind is inspect.Parameter.VAR_KEYWORD
            for p in inspect.signature(handler).parameters.values()
        ), f"{target['method_name']} must accept **kwargs"


def test_health_liveness_readiness_present(endpoint_map):
    ops = {ep["operation_name"]: ep for ep in endpoint_map["endpoints"]}
    for op in ("health", "liveness", "readiness"):
        assert op in ops, f"missing '{op}' endpoint"
        assert ops[op]["api_url"] == f"/{op}"
