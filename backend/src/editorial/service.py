"""Editorial services (extend CrudService)."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import and_, select

from src.core.crud import CrudService
from src.core.errors import ConflictError, ValidationError
from src.editorial.models import (
    Article,
    CaseStudy,
    Ebook,
    LegalDocument,
    NewsItem,
    Quiz,
    QuizOption,
    QuizQuestion,
    QuizResultBand,
    Review,
)
from src.editorial.serializers import (
    serialize_article,
    serialize_band,
    serialize_case,
    serialize_ebook,
    serialize_legal,
    serialize_news,
    serialize_option,
    serialize_question,
    serialize_quiz,
    serialize_review,
)


class _Slug:
    model: Any
    session: Any

    def _slug_unique(self, obj, creating):
        q = select(self.model.id).where(self.model.slug == obj.slug, self.model.deleted_at.is_(None))
        if not creating:
            q = q.where(self.model.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("slug already in use", details={"field": "slug"})


class ArticleService(CrudService, _Slug):
    model = Article
    entity_type = "article"
    event_prefix = "article"
    manager_writable = False
    sortable = ("position", "published_at", "title", "created_at")
    search_columns = ("title", "slug", "excerpt")

    def serialize(self, obj): return serialize_article(obj)
    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class NewsService(CrudService, _Slug):
    model = NewsItem
    entity_type = "news_item"
    event_prefix = "news"
    manager_writable = False
    sortable = ("position", "published_at", "title", "created_at")
    search_columns = ("title", "slug", "summary")

    def serialize(self, obj): return serialize_news(obj)
    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class ReviewService(CrudService):
    model = Review
    entity_type = "review"
    event_prefix = "review"
    clinic_scope_column = "clinic_id"
    sortable = ("review_date", "rating", "position", "created_at")
    search_columns = ("author", "text_body")

    def serialize(self, obj): return serialize_review(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        if data.get("clinic_id"):
            data["clinic_id"] = uuid.UUID(str(data["clinic_id"]))
        return data

    def to_update_values(self, data, obj):
        data = dict(data)
        if data.get("clinic_id"):
            data["clinic_id"] = uuid.UUID(str(data["clinic_id"]))
        return data


class CaseService(CrudService):
    model = CaseStudy
    entity_type = "case_study"
    event_prefix = "case"
    clinic_scope_column = "clinic_id"
    sortable = ("position", "created_at")
    search_columns = ("title", "description")

    def serialize(self, obj): return serialize_case(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        for fk in ("treatment_id", "clinic_id"):
            if data.get(fk):
                data[fk] = uuid.UUID(str(data[fk]))
        return data

    def to_update_values(self, data, obj):
        data = dict(data)
        for fk in ("treatment_id", "clinic_id"):
            if data.get(fk):
                data[fk] = uuid.UUID(str(data[fk]))
        return data


class EbookService(CrudService, _Slug):
    model = Ebook
    entity_type = "ebook"
    event_prefix = "ebook"
    manager_writable = False
    sortable = ("position", "title", "created_at")
    search_columns = ("title", "slug", "description")

    def serialize(self, obj): return serialize_ebook(obj)
    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class LegalService(CrudService):
    model = LegalDocument
    entity_type = "legal_document"
    event_prefix = "legal"
    manager_writable = False
    sortable = ("doc_type", "effective_date", "created_at")
    search_columns = ("doc_type", "version_label")

    def serialize(self, obj): return serialize_legal(obj)


class QuizService(CrudService, _Slug):
    model = Quiz
    entity_type = "quiz"
    event_prefix = "quiz"
    manager_writable = False
    sortable = ("title", "created_at")
    search_columns = ("title", "slug")

    def serialize(self, obj): return serialize_quiz(obj)
    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class QuestionService(CrudService):
    model = QuizQuestion
    entity_type = "quiz_question"
    event_prefix = "quiz"
    manager_writable = False
    sortable = ("position", "created_at")

    def serialize(self, obj): return serialize_question(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["quiz_id"] = uuid.UUID(str(data["quiz_id"]))
        return data


class OptionService(CrudService):
    model = QuizOption
    entity_type = "quiz_option"
    event_prefix = "quiz"
    manager_writable = False
    sortable = ("position", "created_at")

    def serialize(self, obj): return serialize_option(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["question_id"] = uuid.UUID(str(data["question_id"]))
        return data


class BandService(CrudService):
    model = QuizResultBand
    entity_type = "quiz_result_band"
    event_prefix = "quiz"
    manager_writable = False
    sortable = ("min_score", "created_at")

    def serialize(self, obj): return serialize_band(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["quiz_id"] = uuid.UUID(str(data["quiz_id"]))
        return data

    def before_write(self, obj, data, *, creating):
        if obj.max_score < obj.min_score:
            raise ValidationError("max_score must be >= min_score")
        # No overlapping score band within the same quiz.
        q = select(QuizResultBand.id).where(
            QuizResultBand.quiz_id == obj.quiz_id,
            QuizResultBand.deleted_at.is_(None),
            and_(QuizResultBand.min_score <= obj.max_score, QuizResultBand.max_score >= obj.min_score),
        )
        if not creating:
            q = q.where(QuizResultBand.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("score band overlaps an existing band")
