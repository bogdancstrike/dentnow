"""Pydantic validation for editorial resources."""
from __future__ import annotations

import re
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
STATUSES = ("draft", "needs_review", "published", "archived")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _slug(v):
    if v is not None and not SLUG_RE.match(v):
        raise ValueError("slug must be kebab-case")
    return v


class ArticleCreate(_Strict):
    slug: str
    title: str
    category: Optional[str] = None
    excerpt: Optional[str] = None
    body_markdown: Optional[str] = None
    author: Optional[str] = None
    reviewer: Optional[str] = None
    published_at: Optional[date] = None
    reviewed_at: Optional[date] = None
    status: str = "draft"
    position: int = 0
    _s = field_validator("slug")(classmethod(lambda c, v: _slug(v)))

    @field_validator("status")
    @classmethod
    def _st(cls, v):
        if v not in STATUSES:
            raise ValueError("invalid status")
        return v


class ArticleUpdate(_Strict):
    slug: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    excerpt: Optional[str] = None
    body_markdown: Optional[str] = None
    author: Optional[str] = None
    reviewer: Optional[str] = None
    published_at: Optional[date] = None
    reviewed_at: Optional[date] = None
    status: Optional[str] = None
    position: Optional[int] = None


class NewsCreate(_Strict):
    slug: str
    title: str
    category: Optional[str] = None
    summary: Optional[str] = None
    body_markdown: Optional[str] = None
    event_date: Optional[date] = None
    published_at: Optional[date] = None
    status: str = "draft"
    position: int = 0
    _s = field_validator("slug")(classmethod(lambda c, v: _slug(v)))


class NewsUpdate(_Strict):
    slug: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    body_markdown: Optional[str] = None
    event_date: Optional[date] = None
    published_at: Optional[date] = None
    status: Optional[str] = None
    position: Optional[int] = None


class ReviewCreate(_Strict):
    author: str
    review_date: date  # exact date required; relative display is derived client-side
    rating: int = Field(ge=1, le=5)
    source: Optional[str] = None
    source_url: Optional[str] = None
    source_id: Optional[str] = None
    text_body: Optional[str] = None
    clinic_id: Optional[str] = None
    status: str = "draft"
    position: int = 0


class ReviewUpdate(_Strict):
    author: Optional[str] = None
    review_date: Optional[date] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    source: Optional[str] = None
    source_url: Optional[str] = None
    source_id: Optional[str] = None
    text_body: Optional[str] = None
    clinic_id: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None


class CaseCreate(_Strict):
    title: str
    treatment_id: Optional[str] = None
    clinic_id: Optional[str] = None
    before_media_id: Optional[str] = None
    after_media_id: Optional[str] = None
    description: Optional[str] = None
    disclaimer: Optional[str] = None
    position: int = 0


class CaseUpdate(_Strict):
    title: Optional[str] = None
    treatment_id: Optional[str] = None
    clinic_id: Optional[str] = None
    before_media_id: Optional[str] = None
    after_media_id: Optional[str] = None
    description: Optional[str] = None
    disclaimer: Optional[str] = None
    position: Optional[int] = None


class EbookCreate(_Strict):
    slug: str
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    active: bool = True
    position: int = 0
    _s = field_validator("slug")(classmethod(lambda c, v: _slug(v)))


class EbookUpdate(_Strict):
    slug: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    position: Optional[int] = None


class LegalCreate(_Strict):
    doc_type: str
    version_label: str
    effective_date: Optional[date] = None
    body_markdown: Optional[str] = None
    active: bool = False

    @field_validator("doc_type")
    @classmethod
    def _t(cls, v):
        if v not in ("gdpr", "privacy", "terms", "cookies"):
            raise ValueError("invalid legal type")
        return v


class LegalUpdate(_Strict):
    version_label: Optional[str] = None
    effective_date: Optional[date] = None
    body_markdown: Optional[str] = None
    active: Optional[bool] = None


class LegalApprove(_Strict):
    approved: bool = True


class CaseConsent(_Strict):
    consent_state: str

    @field_validator("consent_state")
    @classmethod
    def _c(cls, v):
        if v not in ("none", "pending", "approved", "revoked"):
            raise ValueError("invalid consent state")
        return v


class QuizCreate(_Strict):
    slug: str
    title: str
    intro: Optional[str] = None
    active: bool = True
    _s = field_validator("slug")(classmethod(lambda c, v: _slug(v)))


class QuizUpdate(_Strict):
    slug: Optional[str] = None
    title: Optional[str] = None
    intro: Optional[str] = None
    active: Optional[bool] = None


class QuestionCreate(_Strict):
    quiz_id: str
    prompt: str
    position: int = 0


class QuestionUpdate(_Strict):
    prompt: Optional[str] = None
    position: Optional[int] = None


class OptionCreate(_Strict):
    question_id: str
    label: str
    score: int = 0
    position: int = 0


class OptionUpdate(_Strict):
    label: Optional[str] = None
    score: Optional[int] = None
    position: Optional[int] = None


class BandCreate(_Strict):
    quiz_id: str
    min_score: int
    max_score: int
    title: str
    description: Optional[str] = None
    recommendations: Optional[str] = None
    cta_treatment_id: Optional[str] = None


class BandUpdate(_Strict):
    min_score: Optional[int] = None
    max_score: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    recommendations: Optional[str] = None
    cta_treatment_id: Optional[str] = None
