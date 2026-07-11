"""Pure unit tests for optimistic-concurrency ETag helpers (no DB)."""
from __future__ import annotations

import pytest

from src.core.errors import ConflictError, ValidationError
from src.core.etag import check_version, make_etag, parse_if_match


def test_make_etag_quotes_version():
    assert make_etag(7) == '"7"'


def test_parse_if_match_accepts_quoted_and_unquoted():
    assert parse_if_match('"12"') == 12
    assert parse_if_match("12") == 12


def test_parse_if_match_requires_header():
    with pytest.raises(ValidationError):
        parse_if_match(None)
    with pytest.raises(ValidationError):
        parse_if_match("")


def test_parse_if_match_rejects_weak_and_malformed():
    with pytest.raises(ValidationError):
        parse_if_match('W/"5"')
    with pytest.raises(ValidationError):
        parse_if_match('"not-a-number"')


def test_check_version_passes_when_equal():
    check_version(3, 3)  # no raise


def test_check_version_conflicts_when_stale():
    with pytest.raises(ConflictError) as exc:
        check_version(current=5, expected=3, current_repr={"id": "x"})
    assert exc.value.details["current_version"] == 5
    assert exc.value.status_code == 409
