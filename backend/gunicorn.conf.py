"""Gunicorn config for the DentNow backend API.

Gevent workers give cooperative async I/O and process-based horizontal scaling:
raise ``GUNICORN_WORKERS`` (or add replicas) to scale the API. There is no
scheduler or worker greenlet — DentNow's API is synchronous over PostgreSQL/MinIO.
"""
import os

bind = f"0.0.0.0:{os.getenv('API_PORT', '5100')}"
worker_class = "gevent"
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
worker_connections = int(os.getenv("GUNICORN_WORKER_CONNECTIONS", "1000"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = 5
# Do NOT preload: each worker must import the app after gevent has patched, and
# each needs its own DB engine.
preload_app = False
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()
