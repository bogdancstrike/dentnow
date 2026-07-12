"""Permission-scoped admin quick-search (Task 18).

Backs ``GET /api/v1/admin/search`` — the ``cmdk`` command palette's remote results.
It runs a small, case-insensitive ``ILIKE`` lookup across the managed content families
the calling principal may read, caps each group tightly, excludes soft-deleted rows,
and returns only an opaque ``{type, id, title, route}`` per hit.

Guarantees:

- **Min length** — a query shorter than two characters returns nothing (the palette
  only fetches at 2+ characters).
- **Default-deny** — a principal without ``content:read`` gets an empty result set
  even though the endpoint decorator already enforces the capability.
- **Clinic scope** — a clinic-manager principal only sees their assigned clinics and
  the reviews attached to them; omitting an unassigned record is preferred to
  revealing it.
- **No sensitive payload** — results never carry object keys, checksums, consent,
  contact details, or other private fields; case-image media never appears in search.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Callable

from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.catalog.models import Offer, Treatment
from src.clinics.models import Clinic, Doctor
from src.editorial.models import Article, Ebook, NewsItem, Review
from src.iam.capabilities import CAP_CONTENT_READ
from src.iam.principal import Principal
from src.media.models import MediaAsset
from src.site.models import Page

MIN_QUERY_LENGTH = 2
DEFAULT_GROUP_LIMIT = 5
MAX_GROUP_LIMIT = 20

# Sentinel that matches no row — used when a clinic manager has no assigned clinics.
_NO_MATCH = uuid.UUID(int=0)


def _first_of(*attrs: str, default: str = "untitled") -> Callable[[Any], str]:
    """Build a title resolver: first non-empty attribute value, else ``default``."""

    def _resolve(obj: Any) -> str:
        for name in attrs:
            value = getattr(obj, name, None)
            if value:
                return str(value)
        return default

    return _resolve


@dataclass(frozen=True)
class _Group:
    type: str
    model: Any
    match_columns: tuple[str, ...]
    route_prefix: str
    title: Callable[[Any], str]
    # Clinic-scope attribute for a clinic manager, or None for globally-readable rows.
    scope_column: str | None = None
    # Media: only surface public assets, never de-identified case imagery.
    public_only: bool = False

    def route(self, obj: Any) -> str:
        return f"{self.route_prefix}/{obj.id}"


# Ordered so the palette shows the most navigational families first. Each family
# searches only indexed name/title/slug-style fields.
GROUPS: tuple[_Group, ...] = (
    _Group("clinic", Clinic, ("name", "slug"), "/admin/clinics",
           _first_of("name"), scope_column="id"),
    _Group("page", Page, ("title", "path"), "/admin/pages",
           _first_of("title", "path")),
    _Group("treatment", Treatment, ("name", "slug"), "/admin/treatments",
           _first_of("name")),
    _Group("offer", Offer, ("name", "slug"), "/admin/offers",
           _first_of("name")),
    _Group("doctor", Doctor, ("name", "slug"), "/admin/doctors",
           _first_of("name")),
    _Group("article", Article, ("title", "slug"), "/admin/articles",
           _first_of("title")),
    _Group("news", NewsItem, ("title", "slug"), "/admin/news",
           _first_of("title")),
    _Group("review", Review, ("author",), "/admin/reviews",
           _first_of("author"), scope_column="clinic_id"),
    _Group("ebook", Ebook, ("title", "slug"), "/admin/ebooks",
           _first_of("title")),
    _Group("media", MediaAsset, ("original_filename", "alt_text"), "/admin/media",
           _first_of("original_filename", "alt_text", default="media"), public_only=True),
)


def _clamp_limit(limit: Any) -> int:
    if limit is None:
        return DEFAULT_GROUP_LIMIT
    try:
        n = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_GROUP_LIMIT
    return max(1, min(MAX_GROUP_LIMIT, n))


def _search_group(session: Session, group: _Group, pattern: str, cap: int,
                  scoped: bool, scope_ids: frozenset[uuid.UUID]) -> list[dict]:
    stmt = select(group.model).where(group.model.deleted_at.is_(None))
    stmt = stmt.where(
        or_(*[getattr(group.model, col).ilike(pattern) for col in group.match_columns])
    )
    if group.public_only:
        stmt = stmt.where(group.model.privacy_class == "public")
    if scoped and group.scope_column is not None:
        col = getattr(group.model, group.scope_column)
        stmt = stmt.where(col.in_(scope_ids or {_NO_MATCH}))
    # Stable ranking: primary match field, then id, both ascending and deterministic.
    primary = getattr(group.model, group.match_columns[0])
    stmt = stmt.order_by(primary.asc(), group.model.id.asc()).limit(cap)

    return [
        {
            "type": group.type,
            "id": str(obj.id),
            "title": group.title(obj),
            "route": group.route(obj),
        }
        for obj in session.scalars(stmt).all()
    ]


def search(session: Session, principal: Principal | None, q: str | None,
           limit: Any = None) -> dict:
    """Return ``{"query", "results"}`` — only rows the principal may read."""
    term = (q or "").strip()
    envelope: dict[str, Any] = {"query": term, "results": []}

    # Default-deny: a principal without content:read never receives content.
    if principal is None or not principal.has_capability(CAP_CONTENT_READ):
        return envelope
    if len(term) < MIN_QUERY_LENGTH:
        return envelope

    cap = _clamp_limit(limit)
    pattern = f"%{term}%"
    scoped = principal.is_clinic_scoped
    scope_ids = principal.clinic_scopes

    results: list[dict] = []
    for group in GROUPS:
        results.extend(_search_group(session, group, pattern, cap, scoped, scope_ids))
    envelope["results"] = results
    return envelope
