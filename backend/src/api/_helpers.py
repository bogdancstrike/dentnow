"""Shared helpers for admin CRUD qf handlers.

Each qf handler is a thin, named function (qf resolves them by name from
endpoint.json). These helpers carry the repeated list/get/create/update/delete
mechanics: Pydantic validation, session scope, and ETag headers.
"""
from __future__ import annotations

from functools import wraps
from typing import Any, Callable, Type

from flask import g, jsonify, make_response
from flask import request as flask_request
from pydantic import BaseModel
from pydantic import ValidationError as PydanticValidationError

from src.core.db import session_scope
from src.core.errors import DentNowError, ValidationError
from src.core.pagination import parse_page


def public_endpoint(fn: Callable) -> Callable:
    """Wrap an anonymous/preview handler so a DentNowError becomes the JSON envelope
    with the right status (flask-restx would otherwise surface it as a 500).
    """

    @wraps(fn)
    def wrapper(app, operation, request, **kwargs):
        try:
            return fn(app, operation, request, **kwargs)
        except DentNowError as err:
            body = err.to_dict()
            cid = getattr(g, "correlation_id", None)
            if cid:
                body["correlation_id"] = cid
            return body, err.status_code

    return wrapper


def _validate(model: Type[BaseModel], data: dict | None) -> dict:
    try:
        return model(**(data or {})).model_dump(exclude_unset=True)
    except PydanticValidationError as exc:
        # include_context/include_input drop non-JSON-serializable ValueError ctx.
        raise ValidationError(
            "request validation failed",
            details={"errors": exc.errors(include_url=False, include_context=False, include_input=False)},
        )


def _json(body: Any, status: int = 200, etag: str | None = None):
    resp = make_response(jsonify(body), status)
    if etag:
        resp.headers["ETag"] = etag
    # Admin responses are never cached.
    resp.headers["Cache-Control"] = "no-store"
    return resp


def do_list(service_cls, principal) -> Any:
    with session_scope() as session:
        req = parse_page(
            flask_request.args,
            allowed_sort=service_cls.sortable,
            default_sort=service_cls.default_sort,
        )
        return _json(service_cls(session, principal).list(req), 200)


def do_get(service_cls, principal, obj_id) -> Any:
    with session_scope() as session:
        body, etag = service_cls(session, principal).get(obj_id)
        return _json(body, 200, etag)


def do_create(service_cls, schema, principal) -> Any:
    payload = _validate(schema, flask_request.get_json(silent=True))
    with session_scope() as session:
        body, etag = service_cls(session, principal).create(payload)
        return _json(body, 201, etag)


def do_update(service_cls, schema, principal, obj_id) -> Any:
    payload = _validate(schema, flask_request.get_json(silent=True))
    if_match = flask_request.headers.get("If-Match")
    with session_scope() as session:
        body, etag = service_cls(session, principal).update(obj_id, payload, if_match)
        return _json(body, 200, etag)


def do_delete(service_cls, principal, obj_id) -> Any:
    if_match = flask_request.headers.get("If-Match")
    with session_scope() as session:
        service_cls(session, principal).delete(obj_id, if_match)
        return _json({"status": "deleted"}, 200)
