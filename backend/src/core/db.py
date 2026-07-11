"""SQLAlchemy engine, session, and declarative Base.

PostgreSQL is the single source of truth. One cached engine/sessionmaker is shared
across the API process. DentNow's outbox rows are written in the same transaction as
the business change (see ``session_scope``); there is no post-commit publish because
the relay is deferred (Task 12).
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from src.config import Config

_engine = None
_SessionLocal: sessionmaker | None = None


class Base(DeclarativeBase):
    pass


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            Config.DATABASE_URL,
            pool_size=Config.DB_POOL_SIZE,
            max_overflow=Config.DB_MAX_OVERFLOW,
            pool_timeout=Config.DB_POOL_TIMEOUT,
            pool_pre_ping=True,
            future=True,
        )
    return _engine


def _sessionmaker() -> sessionmaker:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(), expire_on_commit=False, future=True
        )
    return _SessionLocal


@contextmanager
def session_scope() -> Iterator[Session]:
    """Transactional session scope: commit on success, rollback on error."""
    session = _sessionmaker()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def serializable_scope() -> Iterator[Session]:
    """A REPEATABLE READ transaction used by the publication builder (Task 11).

    Publishing loads the full workspace under an advisory lock in a repeatable-read
    transaction so the canonical snapshot is internally consistent.
    """
    session = _sessionmaker()()
    try:
        session.connection(
            execution_options={"isolation_level": "REPEATABLE READ"}
        )
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def new_session() -> Session:
    """A bare session the caller manages."""
    return _sessionmaker()()


def reset_engine_for_tests() -> None:
    """Dispose the cached engine so a test can rebind to a different DATABASE_URL."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None
