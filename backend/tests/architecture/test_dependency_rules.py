"""Architecture rule: domain code must not import vendor SDKs or adapters.

site / clinics / catalog / editorial only emit outbox events; they never import an
external-integration vendor SDK (boto3/botocore/kafka/redis) or an adapter module.
"""
from __future__ import annotations

import ast
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2]
DOMAIN_PACKAGES = ["site", "clinics", "catalog", "editorial"]
FORBIDDEN_ROOTS = {"boto3", "botocore", "kafka", "redis"}
FORBIDDEN_MODULES = {
    "src.media.minio_storage",
    "src.integrations.ports",
}


def _imports(path: Path):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                yield node.module


def test_domain_code_has_no_vendor_or_adapter_imports():
    violations = []
    for pkg in DOMAIN_PACKAGES:
        for py in (BACKEND / "src" / pkg).rglob("*.py"):
            for mod in _imports(py):
                root = mod.split(".")[0]
                if root in FORBIDDEN_ROOTS or mod in FORBIDDEN_MODULES:
                    violations.append(f"{py.relative_to(BACKEND)} imports {mod}")
    assert not violations, "vendor/adapter imports in domain code:\n" + "\n".join(violations)


def test_no_public_endpoint_accepts_patient_data():
    endpoint_map = (BACKEND / "maps" / "endpoint.json").read_text()
    for banned in ("patient", "medical_history", "offer_registration", "appointment"):
        assert banned not in endpoint_map, f"endpoint map references '{banned}'"
