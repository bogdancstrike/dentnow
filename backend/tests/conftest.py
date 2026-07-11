"""Shared pytest fixtures.

DB-backed tests use a transaction that rolls back after each test, so they never
pollute the database. They skip cleanly when DATABASE_URL is unset/unreachable, so
pure-unit runs need no database.
"""
from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Register every model on Base.metadata so cross-table FKs resolve even when a single
# test module is run in isolation.
import src.models_all  # noqa: F401,E402


@pytest.fixture(scope="session")
def db_engine():
    url = os.environ.get("DATABASE_URL")
    if not url:
        pytest.skip("DATABASE_URL not set")
    engine = create_engine(url, future=True)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover
        pytest.skip(f"database not reachable: {exc}")
    return engine


@pytest.fixture()
def db_session(db_engine):
    """A session wrapped in a transaction that is always rolled back."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, expire_on_commit=False, future=True)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
