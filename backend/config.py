"""Top-level config shim required by qf.

The qf framework hard-codes ``app.config.from_object('config.Config')`` and its
ETL import chain does ``from config import Config`` at module load time. Both
require a *top-level* importable ``config`` module — ``src/config.py`` alone is
not found. This shim re-exports the real settings so qf is satisfied regardless
of how the process is launched.
"""
from src.config import Config  # noqa: F401
