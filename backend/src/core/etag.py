"""Optimistic-concurrency ETags derived from a row's integer ``version``.

Admin reads return ``ETag: "<version>"``; updates/deletes require ``If-Match`` and a
stale value yields 409 with the current representation (see the services in Task 7+).
"""
from __future__ import annotations

from .errors import ConflictError, ValidationError


def make_etag(version: int) -> str:
    return f'"{version}"'


def parse_if_match(header: str | None) -> int:
    """Parse an ``If-Match`` header into the expected version integer.

    Raises ValidationError when the header is missing/malformed so mutations cannot
    proceed without optimistic-concurrency control.
    """
    if not header:
        raise ValidationError("If-Match header is required", details={"header": "If-Match"})
    value = header.strip()
    if value.startswith("W/"):  # weak validators are not accepted for writes
        raise ValidationError("weak ETags are not accepted for writes")
    value = value.strip('"')
    try:
        return int(value)
    except ValueError as exc:
        raise ValidationError("If-Match is not a valid version") from exc


def check_version(current: int, expected: int, current_repr: dict | None = None) -> None:
    """Raise ConflictError (409) with the current representation when versions differ."""
    if current != expected:
        raise ConflictError(
            "the resource was modified by another request",
            details={"current_version": current, **({"current": current_repr} if current_repr else {})},
        )
