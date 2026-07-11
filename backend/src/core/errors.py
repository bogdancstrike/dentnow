"""Domain error hierarchy + Flask error handlers.

Handlers return ``(body, status)`` tuples; flask-restx serializes the body. Every
error body follows the documented envelope: ``{error, message, details?,
correlation_id}``.
"""
from __future__ import annotations

from typing import Any


class DentNowError(Exception):
    code = "error"
    status_code = 500

    def __init__(self, message: str = "", *, details: dict[str, Any] | None = None):
        super().__init__(message or self.code)
        self.message = message or self.code
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        body: dict[str, Any] = {"error": self.code, "message": self.message}
        if self.details:
            body["details"] = self.details
        return body


class ValidationError(DentNowError):
    code = "validation_error"
    status_code = 400


class AuthenticationError(DentNowError):
    code = "authentication_error"
    status_code = 401


class PermissionDeniedError(DentNowError):
    code = "permission_denied"
    status_code = 403


class NotFoundError(DentNowError):
    code = "not_found"
    status_code = 404


class ConflictError(DentNowError):
    code = "conflict"
    status_code = 409


class GoneError(DentNowError):
    code = "gone"
    status_code = 410


def install_flask_error_handlers(app) -> None:
    """Catch uncaught exceptions so the API never leaks a stack trace."""
    from flask import g
    from framework.commons.logger import logger as log

    def _with_correlation(body: dict[str, Any]) -> dict[str, Any]:
        cid = getattr(g, "correlation_id", None)
        if cid and "correlation_id" not in body:
            body["correlation_id"] = cid
        return body

    @app.errorhandler(DentNowError)
    def _handle_domain(err: DentNowError):
        return _with_correlation(err.to_dict()), err.status_code

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception):  # pragma: no cover
        from werkzeug.exceptions import HTTPException

        if isinstance(err, HTTPException):
            return (
                _with_correlation(
                    {"error": err.name, "message": err.description or ""}
                ),
                err.code,
            )
        log.exception(f"unhandled error: {err}")
        return (
            _with_correlation(
                {"error": "internal_error", "message": "internal server error"}
            ),
            500,
        )
