"""Server-side pagination parsing and envelope for admin list endpoints."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Sequence

from .errors import ValidationError

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


@dataclass(frozen=True)
class PageRequest:
    page: int
    page_size: int
    q: str | None
    sort: str | None
    order: str

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def parse_page(
    args: dict[str, Any],
    *,
    allowed_sort: Sequence[str] = (),
    default_sort: str | None = None,
) -> PageRequest:
    def _int(name: str, default: int) -> int:
        raw = args.get(name)
        if raw in (None, ""):
            return default
        try:
            return int(raw)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{name} must be an integer") from exc

    page = max(1, _int("page", 1))
    page_size = min(MAX_PAGE_SIZE, max(1, _int("page_size", DEFAULT_PAGE_SIZE)))
    sort = args.get("sort") or default_sort
    if sort is not None and allowed_sort and sort not in allowed_sort:
        raise ValidationError(
            "invalid sort column", details={"allowed": list(allowed_sort)}
        )
    order = (args.get("order") or "asc").lower()
    if order not in ("asc", "desc"):
        raise ValidationError("order must be 'asc' or 'desc'")
    q = args.get("q") or None
    return PageRequest(page=page, page_size=page_size, q=q, sort=sort, order=order)


def page_envelope(items: list[Any], total: int, req: PageRequest) -> dict[str, Any]:
    return {
        "items": items,
        "page": req.page,
        "page_size": req.page_size,
        "total": total,
        "pages": (total + req.page_size - 1) // req.page_size if req.page_size else 0,
    }
