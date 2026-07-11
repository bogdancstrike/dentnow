"""Safe rich text: Markdown source -> sanitized HTML through a fixed allowlist.

Long-form article/legal/treatment text is authored as Markdown and rendered here.
Raw HTML in the source is ignored (``html: False``) and the result is passed through
Bleach with an explicit tag/attribute/protocol allowlist as defense in depth. The
publication validator (Task 11) re-runs :func:`sanitize_html` on all long-form fields.
Arbitrary stored HTML is never accepted.
"""
from __future__ import annotations

import bleach
from markdown_it import MarkdownIt

_md = MarkdownIt("commonmark", {"html": False, "linkify": True, "typographer": False})

ALLOWED_TAGS = [
    "p", "br", "hr", "strong", "em", "b", "i", "u", "s", "sub", "sup",
    "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre",
    "table", "thead", "tbody", "tr", "th", "td", "span",
]
ALLOWED_ATTRS = {
    "a": ["href", "title", "rel", "target"],
    "th": ["align"],
    "td": ["align"],
}
ALLOWED_PROTOCOLS = ["http", "https", "mailto", "tel"]


def _clean(html: str) -> str:
    cleaned = bleach.clean(
        html or "",
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    # Force safe rel on links.
    return bleach.linkify(
        cleaned,
        callbacks=[lambda attrs, new=False: {**attrs, (None, "rel"): "noopener noreferrer nofollow"}],
        skip_tags=["pre", "code"],
    )


def render_markdown(md_source: str | None) -> str:
    """Render trusted-authored Markdown to sanitized HTML."""
    return _clean(_md.render(md_source or ""))


def sanitize_html(html: str | None) -> str:
    """Re-sanitize already-rendered HTML (used again at publish time)."""
    return _clean(html or "")
