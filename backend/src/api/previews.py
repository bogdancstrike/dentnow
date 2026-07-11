"""Preview-origin API. No Keycloak — a one-use fragment token is exchanged for a
short-lived HttpOnly, SameSite=Strict, host-only cookie. All responses are no-store
and noindex.
"""
from __future__ import annotations

from src.api._helpers import public_endpoint

from flask import Response
from flask import request as flask_request
from flask import jsonify, make_response

from src.config import Config
from src.core.db import session_scope
from src.core.errors import AuthenticationError, NotFoundError
from src.iam.principal import Principal
from src.media.service import MediaService
from src.site import preview_service

COOKIE = "dn_preview"


def _no_store(resp):
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["X-Robots-Tag"] = "noindex"
    return resp


def _secure() -> bool:
    return Config.ENVIRONMENT.lower() != "local"


def _origin_ok() -> bool:
    origin = flask_request.headers.get("Origin")
    return origin is None or origin == Config.PREVIEW_APP_URL if hasattr(Config, "PREVIEW_APP_URL") else True


@public_endpoint
def preview_session_create(app, operation, request, **kw):
    token = (flask_request.get_json(silent=True) or {}).get("token")
    if not token:
        raise AuthenticationError("token is required")
    with session_scope() as session:
        secret = preview_service.exchange_token(session, token)
    resp = make_response(jsonify({"status": "ok"}), 200)
    resp.set_cookie(
        COOKIE, secret, max_age=Config.PREVIEW_TOKEN_TTL_SECONDS, httponly=True,
        samesite="Strict", secure=_secure(), path="/api/v1/preview",
    )
    return _no_store(resp)


@public_endpoint
def preview_session_revoke(app, operation, request, **kw):
    with session_scope() as session:
        preview_service.revoke(session, flask_request.cookies.get(COOKIE))
    resp = make_response(jsonify({"status": "revoked"}), 200)
    resp.delete_cookie(COOKIE, path="/api/v1/preview")
    return _no_store(resp)


def _frozen():
    with session_scope() as session:
        row = preview_service.session_from_cookie(session, flask_request.cookies.get(COOKIE))
        return row.snapshot


@public_endpoint
def preview_bootstrap(app, operation, request, **kw):
    snap = _frozen()
    body = {"site": snap.get("site"), "links": snap.get("links", []),
            "navigation": snap.get("navigation", {}), "clinics": snap.get("clinics", []), "preview": True}
    return _no_store(make_response(jsonify(body), 200))


@public_endpoint
def preview_page_by_path(app, operation, request, **kw):
    path = flask_request.args.get("path")
    snap = _frozen()
    page = (snap.get("pages_by_path") or {}).get(path)
    if page is None:
        raise NotFoundError("page not found")
    return _no_store(make_response(jsonify({"page": page, "preview": True}), 200))


@public_endpoint
def preview_articles(app, operation, request, **kw):
    snap = _frozen()
    articles = (snap.get("editorial") or {}).get("articles", [])
    return _no_store(make_response(jsonify({"items": articles, "preview": True}), 200))


@public_endpoint
def preview_article_detail(app, operation, request, slug=None, **kw):
    snap = _frozen()
    match = next((a for a in (snap.get("editorial") or {}).get("articles", []) if a.get("slug") == slug), None)
    if match is None:
        raise NotFoundError("article not found")
    return _no_store(make_response(jsonify({"article": match, "preview": True}), 200))


@public_endpoint
def preview_media(app, operation, request, asset_id=None, variant="card", **kw):
    snap = _frozen()
    if str(asset_id) not in (snap.get("media") or {}):
        raise NotFoundError("media not in preview")
    with session_scope() as session:
        data, content_type, etag, _cache = MediaService(
            session, Principal(subject="preview", roles=frozenset())
        ).read_variant(asset_id, variant, require_publication=False)
    resp = Response(data, mimetype=content_type)
    resp.headers["ETag"] = etag
    return _no_store(resp)
