"""Articles, news, reviews, cases, ebooks, legal, quiz (schema slice 5)."""
from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base
from src.core.mixins import WorkspaceRoot

ARTICLE_STATUSES = ("draft", "needs_review", "published", "archived")
LEGAL_TYPES = ("gdpr", "privacy", "terms", "cookies")


class Article(WorkspaceRoot, Base):
    __tablename__ = "articles"
    __table_args__ = (
        CheckConstraint("status IN ('draft','needs_review','published','archived')", name="ck_articles_status"),
        Index("uq_articles_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    author: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at = mapped_column(Date, nullable=True)
    reviewed_at = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class NewsItem(WorkspaceRoot, Base):
    __tablename__ = "news_items"
    __table_args__ = (
        CheckConstraint("status IN ('draft','needs_review','published','archived')", name="ck_news_status"),
        Index("uq_news_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    event_date = mapped_column(Date, nullable=True)
    published_at = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Review(WorkspaceRoot, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
        CheckConstraint("status IN ('draft','needs_review','published','archived')", name="ck_reviews_status"),
        Index("ix_reviews_clinic", "clinic_id"),
    )
    source: Mapped[str | None] = mapped_column(Text, nullable=True)  # google, facebook, ...
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(Text, nullable=False)
    review_date = mapped_column(Date, nullable=False)  # exact date, never relative
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped["DateTime | None"] = mapped_column(DateTime(timezone=True), nullable=True)
    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clinics.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class CaseStudy(WorkspaceRoot, Base):
    __tablename__ = "case_studies"
    __table_args__ = (
        CheckConstraint(
            "consent_state IN ('none','pending','approved','revoked')", name="ck_case_consent"
        ),
        Index("ix_case_studies_treatment", "treatment_id"),
        Index("ix_case_studies_clinic", "clinic_id"),
    )
    treatment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("treatments.id", ondelete="SET NULL"), nullable=True
    )
    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clinics.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    after_media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    disclaimer: Mapped[str | None] = mapped_column(Text, nullable=True)
    consent_state: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'none'"))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Ebook(WorkspaceRoot, Base):
    __tablename__ = "ebooks"
    __table_args__ = (
        Index("uq_ebooks_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    download_media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class LegalDocument(WorkspaceRoot, Base):
    __tablename__ = "legal_documents"
    __table_args__ = (
        CheckConstraint("doc_type IN ('gdpr','privacy','terms','cookies')", name="ck_legal_type"),
        Index("ix_legal_documents_type", "doc_type"),
    )
    doc_type: Mapped[str] = mapped_column(Text, nullable=False)
    version_label: Mapped[str] = mapped_column(Text, nullable=False)
    effective_date = mapped_column(Date, nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped["DateTime | None"] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Quiz(WorkspaceRoot, Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        Index("uq_quizzes_slug_live", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    intro: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class QuizQuestion(WorkspaceRoot, Base):
    __tablename__ = "quiz_questions"
    __table_args__ = (Index("ix_quiz_questions_quiz", "quiz_id"),)
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class QuizOption(WorkspaceRoot, Base):
    __tablename__ = "quiz_options"
    __table_args__ = (Index("ix_quiz_options_question", "question_id"),)
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    media_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class QuizResultBand(WorkspaceRoot, Base):
    __tablename__ = "quiz_result_bands"
    __table_args__ = (
        CheckConstraint("max_score >= min_score", name="ck_quiz_band_range"),
        Index("ix_quiz_result_bands_quiz", "quiz_id"),
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    min_score: Mapped[int] = mapped_column(Integer, nullable=False)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    cta_treatment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("treatments.id", ondelete="SET NULL"), nullable=True
    )
