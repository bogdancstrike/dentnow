"""Shared helpers for admin CRUD qf handlers.

Each qf handler is a thin, named function (qf resolves them by name from
endpoint.json). These helpers carry the repeated list/get/create/update/delete
mechanics: Pydantic validation, session scope, and ETag headers.
"""
from __future__ import annotations

from typing import Any, Type

from flask import jsonify, make_response
from flask import request as flask_request
from pydantic import BaseModel
from pydantic import ValidationError as PydanticValidationError

from src.core.db import session_scope
from src.core.errors import ValidationError
from src.core.pagination import parse_page


def _validate(model: Type[BaseModel], data: dict | None) -> dict:
    try:
        return model(**(data or {})).model_dump(exclude_unset=True)
    except PydanticValidationError as exc:
        raise ValidationError(
            "request validation failed",
            details={"errors": exc.errors(include_url=False)},
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
