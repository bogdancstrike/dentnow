from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


CONFIG_SOURCE = Path(__file__).resolve().parents[2] / "src" / "config.py"


def _load_isolated_config(tmp_path: Path, process_values: dict[str, str]) -> dict:
    backend_dir = tmp_path / "backend"
    src_dir = backend_dir / "src"
    src_dir.mkdir(parents=True)
    (src_dir / "__init__.py").write_text("", encoding="utf-8")
    shutil.copyfile(CONFIG_SOURCE, src_dir / "config.py")
    (backend_dir / ".env").write_text(
        "SERVICE_NAME=from-backend-dotenv\nAPI_PORT=5999\n",
        encoding="utf-8",
    )

    environment = os.environ.copy()
    environment.pop("SERVICE_NAME", None)
    environment.pop("API_PORT", None)
    environment.update(process_values)
    command = (
        "import json, sys; "
        f"sys.path.insert(0, {str(backend_dir)!r}); "
        "from src.config import Config; "
        "print(json.dumps({'service': Config.SERVICE_NAME, 'port': Config.API_PORT}))"
    )
    result = subprocess.run(
        [sys.executable, "-c", command],
        cwd=tmp_path,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def test_config_reads_backend_dotenv_independent_of_working_directory(tmp_path):
    assert _load_isolated_config(tmp_path, {}) == {
        "service": "from-backend-dotenv",
        "port": 5999,
    }


def test_process_environment_takes_precedence_over_backend_dotenv(tmp_path):
    assert _load_isolated_config(tmp_path, {"SERVICE_NAME": "from-process"}) == {
        "service": "from-process",
        "port": 5999,
    }
