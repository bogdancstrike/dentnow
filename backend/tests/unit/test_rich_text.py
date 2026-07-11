"""Markdown sanitizer: no scripts, event attrs, unsafe schemes, iframes, or styles."""
from __future__ import annotations

from src.editorial.rich_text import render_markdown, sanitize_html


def test_strips_script_tag():
    out = render_markdown("Hello\n\n<script>alert(1)</script>")
    assert "<script" not in out
    assert "alert(1)" not in out or "<script" not in out


def test_raw_html_is_not_emitted_as_tags():
    out = render_markdown('<img src=x onerror="alert(1)">')
    assert "<img" not in out  # raw HTML is escaped, never rendered as a live tag


def test_unsafe_url_scheme_removed():
    # markdown-it refuses to render javascript: as a link (emits plain text), and the
    # sanitizer strips a javascript: href from raw anchor HTML.
    assert "<a " not in render_markdown("[click](javascript:alert(1))")
    out = sanitize_html('<a href="javascript:alert(1)">x</a>')
    assert "javascript:" not in out


def test_iframe_removed():
    out = sanitize_html("<iframe src='https://evil.example'></iframe><p>safe</p>")
    assert "<iframe" not in out
    assert "safe" in out


def test_style_attr_and_tag_removed():
    out = sanitize_html('<p style="position:absolute">hi</p><style>*{}</style>')
    assert "style=" not in out
    assert "<style" not in out


def test_allows_basic_formatting_and_links():
    out = render_markdown("## Heading\n\n**bold** and [link](https://x.example)")
    assert "<h2>" in out
    assert "<strong>bold</strong>" in out
    assert 'href="https://x.example"' in out
    assert "nofollow" in out  # links get safe rel


def test_h1_is_downgraded_to_text():
    # h1 is reserved for the page title; the tag is stripped but text kept.
    out = render_markdown("# Big")
    assert "<h1" not in out
    assert "Big" in out
