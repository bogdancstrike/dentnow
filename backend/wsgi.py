"""DentNow backend WSGI entrypoint (gunicorn target: ``wsgi:app``).

Each gunicorn gevent worker imports this module, which:

  1. monkey-patches gevent FIRST so all I/O (sockets, psycopg2) is cooperative;
  2. builds the Flask API via qf ``FrameworkApp`` with ``enable_etl=False`` — DentNow
     needs no Kafka, no Redis, and no ETL workers in this release;
  3. installs correlation-id and error hooks on the returned Flask app.

Unlike the referenced testing platform, DentNow spawns NO scheduler greenlet and
creates NO Kafka topics: the API, database, and object-store work is entirely
synchronous. Retention cleanup is the separate idempotent ``scripts/gc_media.py``
operations command, never an in-process thread.
"""
# gevent monkey-patching MUST run before anything imports ssl/socket/threading.
from gevent import monkey  # noqa: E402

monkey.patch_all()

try:  # make psycopg2 yield to the gevent hub instead of blocking it
    import psycogreen.gevent

    psycogreen.gevent.patch_psycopg()
except Exception:  # pragma: no cover
    pass

import sys  # noqa: E402
from pathlib import Path  # noqa: E402

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from src.config import Config  # noqa: E402
from framework.app import FrameworkApp, FrameworkSettings  # noqa: E402
from framework.commons.logger import logger as log  # noqa: E402
import src.models_all  # noqa: E402, F401 - register models/metadata


def _build_app():
    settings = FrameworkSettings(
        enable_etl=False,  # DentNow needs no Kafka/Redis/ETL workers
        enable_api=True,
        enable_dynamic_endpoints=True,
        api_host="0.0.0.0",
        api_port=Config.API_PORT,
        api_version="1.0",
        api_title="DentNow Content API",
        api_description="DentNow — public published content + Keycloak-protected administration",
        endpoint_json_path="maps/endpoint.json",
        enable_tracing=Config.ENABLE_TRACING,
        otlp_endpoint=Config.OTLP_ENDPOINT,
        service_name=Config.SERVICE_NAME,
    )
    fw = FrameworkApp(settings, app_root=BASE_DIR)
    handles = fw.run()
    flask_app = handles.app

    from src.core.correlation import install_flask_hooks
    from src.core.errors import install_flask_error_handlers

    install_flask_hooks(flask_app)
    install_flask_error_handlers(flask_app)

    log.info(
        f"dentnow backend ready (service={Config.SERVICE_NAME} "
        f"port={Config.API_PORT} env={Config.ENVIRONMENT} rev={Config.BUILD_REVISION})"
    )
    return flask_app


app = _build_app()
