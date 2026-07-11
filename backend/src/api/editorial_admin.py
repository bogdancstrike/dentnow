"""Admin CRUD handlers for editorial, legal, quiz + approval commands."""
from __future__ import annotations

import uuid

from flask import request as flask_request

from src.api._helpers import _json, _validate, do_create, do_delete, do_get, do_list, do_update
from src.audit.service import write_audit
from src.core.clock import utcnow
from src.core.correlation import get_correlation_id
from src.core.db import session_scope
from src.core.errors import NotFoundError
from src.editorial import schemas as S
from src.editorial import service as SV
from src.editorial.models import CaseStudy, LegalDocument
from src.editorial.serializers import serialize_case, serialize_legal
from src.iam.capabilities import CAP_ATTESTATION_APPROVE, CAP_CONTENT_READ, CAP_CONTENT_WRITE
from src.iam.decorators import require_capability
from src.integrations.outbox import enqueue_event
from src.site.workspace import bump_workspace_version


def _crud(prefix, service, create_schema, update_schema, id_param, *, has_get=False):
    g = globals()

    @require_capability(CAP_CONTENT_READ)
    def _list(app, operation, request, principal=None, **kw):
        return do_list(service, principal)

    @require_capability(CAP_CONTENT_WRITE)
    def _create(app, operation, request, principal=None, **kw):
        return do_create(service, create_schema, principal)

    @require_capability(CAP_CONTENT_WRITE)
    def _update(app, operation, request, principal=None, **kw):
        return do_update(service, update_schema, principal, kw.get(id_param))

    @require_capability(CAP_CONTENT_WRITE)
    def _delete(app, operation, request, principal=None, **kw):
        return do_delete(service, principal, kw.get(id_param))

    g[f"{prefix}_list"] = _list
    g[f"{prefix}_create"] = _create
    g[f"{prefix}_update"] = _update
    g[f"{prefix}_delete"] = _delete
    if has_get:
        @require_capability(CAP_CONTENT_READ)
        def _get(app, operation, request, principal=None, **kw):
            return do_get(service, principal, kw.get(id_param))
        g[f"{prefix}_get"] = _get


_crud("articles", SV.ArticleService, S.ArticleCreate, S.ArticleUpdate, "article_id", has_get=True)
_crud("news", SV.NewsService, S.NewsCreate, S.NewsUpdate, "news_id", has_get=True)
_crud("reviews", SV.ReviewService, S.ReviewCreate, S.ReviewUpdate, "review_id")
_crud("cases", SV.CaseService, S.CaseCreate, S.CaseUpdate, "case_id", has_get=True)
_crud("ebooks", SV.EbookService, S.EbookCreate, S.EbookUpdate, "ebook_id")
_crud("legal", SV.LegalService, S.LegalCreate, S.LegalUpdate, "legal_id", has_get=True)
_crud("quizzes", SV.QuizService, S.QuizCreate, S.QuizUpdate, "quiz_id", has_get=True)
_crud("quiz_questions", SV.QuestionService, S.QuestionCreate, S.QuestionUpdate, "question_id")
_crud("quiz_options", SV.OptionService, S.OptionCreate, S.OptionUpdate, "option_id")
_crud("quiz_bands", SV.BandService, S.BandCreate, S.BandUpdate, "band_id")


# ── legal approval (publisher/admin) ─────────────────────────────────────────
@require_capability(CAP_ATTESTATION_APPROVE)
def legal_approve(app, operation, request, principal=None, legal_id=None, **kw):
    _validate(S.LegalApprove, flask_request.get_json(silent=True))
    cid = get_correlation_id()
    with session_scope() as session:
        doc = session.get(LegalDocument, uuid.UUID(str(legal_id)))
        if doc is None or doc.deleted_at is not None:
            raise NotFoundError("legal document not found")
        before = serialize_legal(doc)
        doc.approved_by = principal.subject
        doc.approved_at = utcnow()
        doc.active = True
        doc.version += 1
        session.flush()
        after = serialize_legal(doc)
        write_audit(session, action="legal_document.approve", entity_type="legal_document",
                    entity_id=doc.id, principal=principal, before=before, after=after, correlation_id=cid)
        bump_workspace_version(session)
        return _json(after, 200)


# ── case-image consent state (approve/revoke require attestation capability) ──
@require_capability(CAP_ATTESTATION_APPROVE)
def case_consent(app, operation, request, principal=None, case_id=None, **kw):
    payload = _validate(S.CaseConsent, flask_request.get_json(silent=True))
    cid = get_correlation_id()
    with session_scope() as session:
        case = session.get(CaseStudy, uuid.UUID(str(case_id)))
        if case is None or case.deleted_at is not None:
            raise NotFoundError("case study not found")
        if not principal.can_access_clinic(case.clinic_id):
            raise NotFoundError("case study not found")
        before = serialize_case(case)
        case.consent_state = payload["consent_state"]
        case.version += 1
        session.flush()
        after = serialize_case(case)
        write_audit(session, action="case_study.consent", entity_type="case_study",
                    entity_id=case.id, principal=principal, before=before, after=after, correlation_id=cid)
        enqueue_event(session, event_type="case.consent.updated.v1", aggregate_type="case_study",
                      aggregate_id=case.id, payload={"consent_state": case.consent_state}, correlation_id=cid)
        bump_workspace_version(session)
        return _json(after, 200)
