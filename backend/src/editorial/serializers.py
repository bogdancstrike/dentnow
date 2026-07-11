"""Editorial serializers. Long-form markdown is exposed as sanitized `*_html`."""
from __future__ import annotations

from typing import Any

from src.editorial.rich_text import render_markdown


def _iso(dt) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, str):  # value not yet coerced by the DB (pre-refresh)
        return dt
    return dt.isoformat()


def _base(o: Any) -> dict:
    return {"id": str(o.id), "version": o.version, "created_at": _iso(o.created_at), "updated_at": _iso(o.updated_at)}


def serialize_article(o: Any) -> dict:
    return {
        **_base(o),
        "slug": o.slug, "category": o.category, "title": o.title, "excerpt": o.excerpt,
        "body_markdown": o.body_markdown, "body_html": render_markdown(o.body_markdown),
        "cover_media_id": str(o.cover_media_id) if o.cover_media_id else None,
        "author": o.author, "reviewer": o.reviewer,
        "published_at": _iso(o.published_at), "reviewed_at": _iso(o.reviewed_at),
        "status": o.status, "position": o.position,
    }


def serialize_news(o: Any) -> dict:
    return {
        **_base(o),
        "slug": o.slug, "category": o.category, "title": o.title, "summary": o.summary,
        "body_markdown": o.body_markdown, "body_html": render_markdown(o.body_markdown),
        "media_id": str(o.media_id) if o.media_id else None,
        "event_date": _iso(o.event_date), "published_at": _iso(o.published_at),
        "status": o.status, "position": o.position,
    }


def serialize_review(o: Any) -> dict:
    return {
        **_base(o),
        "source": o.source, "source_url": o.source_url, "source_id": o.source_id,
        "author": o.author, "review_date": _iso(o.review_date), "rating": o.rating,
        "text_body": o.text_body, "verified_at": _iso(o.verified_at),
        "clinic_id": str(o.clinic_id) if o.clinic_id else None,
        "status": o.status, "position": o.position,
    }


def serialize_case(o: Any) -> dict:
    return {
        **_base(o),
        "treatment_id": str(o.treatment_id) if o.treatment_id else None,
        "clinic_id": str(o.clinic_id) if o.clinic_id else None,
        "title": o.title, "description": o.description,
        "before_media_id": str(o.before_media_id) if o.before_media_id else None,
        "after_media_id": str(o.after_media_id) if o.after_media_id else None,
        "disclaimer": o.disclaimer, "consent_state": o.consent_state, "position": o.position,
    }


def serialize_ebook(o: Any) -> dict:
    return {
        **_base(o),
        "slug": o.slug, "title": o.title, "category": o.category, "description": o.description,
        "cover_media_id": str(o.cover_media_id) if o.cover_media_id else None,
        "download_media_id": str(o.download_media_id) if o.download_media_id else None,
        "active": o.active, "position": o.position,
    }


def serialize_legal(o: Any) -> dict:
    return {
        **_base(o),
        "doc_type": o.doc_type, "version_label": o.version_label,
        "effective_date": _iso(o.effective_date),
        "body_markdown": o.body_markdown, "body_html": render_markdown(o.body_markdown),
        "approved_by": o.approved_by, "approved_at": _iso(o.approved_at), "active": o.active,
    }


def serialize_quiz(o: Any) -> dict:
    return {**_base(o), "slug": o.slug, "title": o.title, "intro": o.intro, "active": o.active}


def serialize_question(o: Any) -> dict:
    return {**_base(o), "quiz_id": str(o.quiz_id), "prompt": o.prompt, "position": o.position}


def serialize_option(o: Any) -> dict:
    return {
        **_base(o), "question_id": str(o.question_id), "label": o.label, "score": o.score,
        "media_id": str(o.media_id) if o.media_id else None, "position": o.position,
    }


def serialize_band(o: Any) -> dict:
    return {
        **_base(o), "quiz_id": str(o.quiz_id), "min_score": o.min_score, "max_score": o.max_score,
        "title": o.title, "description": o.description, "recommendations": o.recommendations,
        "cta_treatment_id": str(o.cta_treatment_id) if o.cta_treatment_id else None,
    }
