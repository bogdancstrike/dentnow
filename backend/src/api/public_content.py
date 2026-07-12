"""Anonymous public read surface — always from the single active publication."""
from __future__ import annotations

from src.api._helpers import public_endpoint

from flask import Response
from flask import request as flask_request
from flask import jsonify, make_response

from src.core.db import session_scope
from src.core.errors import NotFoundError
from src.site.publication_service import active_snapshot


def _etag(chash: str) -> str:
    return f'"{chash}"'


def _public_json(body: dict, version: int, chash: str):
    inm = flask_request.headers.get("If-None-Match")
    etag = _etag(chash)
    if inm and inm == etag:
        resp = make_response("", 304)
    else:
        resp = make_response(jsonify(body), 200)
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=300"
    resp.headers["X-Release-Version"] = str(version)
    return resp


def _require_active():
    with session_scope() as session:
        active = active_snapshot(session)
    if active is None:
        raise NotFoundError("no active publication")
    return active  # (snapshot_dict, version, content_hash)


@public_endpoint
def bootstrap(app, operation, request, **kw):
    snap, version, chash = _require_active()
    body = {
        "release_version": version,
        "site": snap.get("site"),
        "links": snap.get("links", []),
        "navigation": snap.get("navigation", {}),
        "clinics": snap.get("clinics", []),
        "homepage_treatments": [t for t in snap.get("treatments", []) if t.get("homepage_featured")],
    }
    return _public_json(body, version, chash)


@public_endpoint
def page_by_path(app, operation, request, **kw):
    path = flask_request.args.get("path")
    if not path:
        raise NotFoundError("path is required")
    snap, version, chash = _require_active()
    page = (snap.get("pages_by_path") or {}).get(path)
    if page is None:
        raise NotFoundError("page not found")
    return _public_json({"release_version": version, "page": page}, version, chash)


@public_endpoint
def articles_list(app, operation, request, **kw):
    snap, version, chash = _require_active()
    articles = (snap.get("editorial") or {}).get("articles", [])
    summaries = [{k: a.get(k) for k in ("slug", "title", "excerpt", "cover_media_id", "published_at")} for a in articles]
    return _public_json({"release_version": version, "items": summaries, "total": len(summaries)}, version, chash)


@public_endpoint
def article_detail(app, operation, request, slug=None, **kw):
    snap, version, chash = _require_active()
    articles = (snap.get("editorial") or {}).get("articles", [])
    match = next((a for a in articles if a.get("slug") == slug), None)
    if match is None:
        raise NotFoundError("article not found")
    return _public_json({"release_version": version, "article": match}, version, chash)


@public_endpoint
def treatments(app, operation, request, **kw):
    """Per-route: the treatments list (loaded when /tratamente is opened)."""
    snap, version, chash = _require_active()
    return _public_json(
        {"release_version": version, "items": snap.get("treatments", [])}, version, chash
    )


@public_endpoint
def offers(app, operation, request, **kw):
    """Per-route: the offers list (loaded when /oferte is opened)."""
    snap, version, chash = _require_active()
    return _public_json(
        {"release_version": version, "items": snap.get("offers", [])}, version, chash
    )


@public_endpoint
def reviews(app, operation, request, **kw):
    """Per-route: the reviews list (loaded when /recenzii is opened)."""
    snap, version, chash = _require_active()
    editorial = snap.get("editorial") or {}
    return _public_json(
        {"release_version": version, "items": editorial.get("reviews", [])}, version, chash
    )


@public_endpoint
def clinics(app, operation, request, **kw):
    """Per-route: the full clinic list (bootstrap carries only what the shell needs)."""
    snap, version, chash = _require_active()
    return _public_json(
        {"release_version": version, "items": snap.get("clinics", [])}, version, chash
    )


@public_endpoint
def sitemap(app, operation, request, **kw):
    from src.config import Config

    snap, version, chash = _require_active()
    base = Config.KEYCLOAK_PUBLIC_URL  # placeholder host; real host injected by edge/nginx
    paths = [p for p, pg in (snap.get("pages_by_path") or {}).items() if pg.get("indexable", True)]
    for a in (snap.get("editorial") or {}).get("articles", []):
        paths.append(f"/articole/{a.get('slug')}")
    urls = "".join(f"<url><loc>{p}</loc></url>" for p in sorted(set(paths)))
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    resp = Response(xml, mimetype="application/xml")
    resp.headers["Cache-Control"] = "public, max-age=300"
    resp.headers["X-Release-Version"] = str(version)
    return resp


@public_endpoint
def news_list(app, operation, request, **kw):
    snap, version, chash = _require_active()
    items = (snap.get("editorial") or {}).get("news", [])
    return _json_response({"items": items}, version, chash)
