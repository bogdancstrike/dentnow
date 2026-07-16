"""Anonymous public read surface — queries the database directly in real time."""
from __future__ import annotations

from datetime import date
import hashlib

from flask import Response, jsonify, make_response
from flask import request as flask_request
from sqlalchemy import select

from src.api._helpers import public_endpoint
from src.catalog.models import (
    Offer,
    OfferClinic,
    OfferFeature,
    OfferTreatment,
    Partner,
    Treatment,
    TreatmentCategory,
    TreatmentPrice,
)
from src.clinics.models import (
    Clinic,
    ClinicContact,
    ClinicFaq,
    ClinicHours,
    ClinicTransitItem,
    Doctor,
)
from src.core.db import session_scope
from src.core.errors import NotFoundError
from src.editorial.models import (
    Article,
    CaseStudy,
    LegalDocument,
    NewsItem,
    Quiz,
    QuizOption,
    QuizQuestion,
    QuizResultBand,
    Review,
)
from src.editorial.rich_text import render_markdown
from src.site.models import (
    CasFaq,
    CasStep,
    GalleryImage,
    HomepageService,
    NavigationItem,
    NavigationMenu,
    Page,
    PageSection,
    PageSeo,
    SiteLink,
    SiteState,
    SiteText,
)


def _live(model):
    return select(model).where(model.deleted_at.is_(None))


def _json_response(body: dict):
    payload = jsonify(body)
    content_hash = hashlib.sha256(payload.get_data()).hexdigest()
    etag = f'"{content_hash}"'
    if flask_request.headers.get("If-None-Match") == etag:
        resp = make_response("", 304)
    else:
        resp = make_response(payload, 200)
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Release-Version"] = str(body.get("release_version", 1))
    return resp


# ── helpers that query models directly ──────────────────────────────────────


def _query_clinics(session):
    clinics = []
    for c in session.scalars(_live(Clinic)).all():
        contacts = [
            {"kind": ct.kind, "display_value": ct.display_value, "normalized_value": ct.normalized_value,
             "url": ct.url, "label": ct.label, "position": ct.position, "is_primary": ct.is_primary}
            for ct in session.scalars(_live(ClinicContact).where(ClinicContact.clinic_id == c.id)).all()
        ]
        contacts.sort(key=lambda x: (x["position"], x["kind"]))
        hours = [
            {"weekday": h.weekday, "opens_at": h.opens_at.isoformat() if h.opens_at else None,
             "closes_at": h.closes_at.isoformat() if h.closes_at else None, "closed": h.closed}
            for h in session.scalars(_live(ClinicHours).where(ClinicHours.clinic_id == c.id)).all()
        ]
        hours.sort(key=lambda x: x["weekday"])
        transit = [
            {"mode": t.mode, "label": t.label, "detail": t.detail, "position": t.position}
            for t in session.scalars(_live(ClinicTransitItem).where(ClinicTransitItem.clinic_id == c.id)).all()
        ]
        transit.sort(key=lambda x: (x["position"], x["label"]))
        faqs = [
            {"question": f.question, "answer": f.answer, "position": f.position}
            for f in session.scalars(_live(ClinicFaq).where(ClinicFaq.clinic_id == c.id)).all()
        ]
        faqs.sort(key=lambda x: (x["position"], x["question"]))
        clinics.append({
            "slug": c.slug, "name": c.name, "area": c.area, "address_full": c.address_full,
            "postal_code": c.postal_code,
            "latitude": float(c.latitude) if c.latitude is not None else None,
            "longitude": float(c.longitude) if c.longitude is not None else None,
            "map_embed_url": c.map_embed_url, "map_link_url": c.map_link_url,
            "position": c.position,
            "contacts": contacts, "hours": hours, "transit": transit, "faqs": faqs,
        })
    clinics.sort(key=lambda x: (x["position"], x["name"]))
    return clinics


def _query_decontat_cas(session):
    steps = [
        {"title": s.title, "text": s.text, "position": s.position}
        for s in session.scalars(_live(CasStep).where(CasStep.active.is_(True))).all()
    ]
    steps.sort(key=lambda x: x["position"])
    faqs = [
        {"q": f.question, "a": f.answer, "position": f.position}
        for f in session.scalars(_live(CasFaq).where(CasFaq.active.is_(True))).all()
    ]
    faqs.sort(key=lambda x: x["position"])
    return {"steps": steps, "faqs": faqs}


def _query_gallery(session):
    items = []
    for g in session.scalars(_live(GalleryImage).where(GalleryImage.active.is_(True))).all():
        items.append({
            "media_id": str(g.media_id) if g.media_id else None,
            "image_url": g.image_url,
            "title": g.title, "caption": g.caption, "alt_text": g.alt_text,
            "position": g.position,
        })
    items.sort(key=lambda x: x["position"])
    return items


def _query_homepage_services(session):
    services = []
    for s in session.scalars(_live(HomepageService).where(HomepageService.active.is_(True))).all():
        services.append({
            "title": s.title, "description": s.description, "icon": s.icon,
            "link": s.link, "position": s.position,
        })
    services.sort(key=lambda x: x["position"])
    return services


def _query_doctors(session):
    doctors = []
    for d in session.scalars(_live(Doctor).where(Doctor.active.is_(True))).all():
        doctors.append({
            "slug": d.slug, "name": d.name, "role": d.role, "focus": d.focus,
            "description": d.description, "approach": d.approach, "credentials": d.credentials,
            "portrait_media_id": str(d.portrait_media_id) if d.portrait_media_id else None,
            "workspace_media_id": str(d.workspace_media_id) if d.workspace_media_id else None,
            "secondary_media_id": str(d.secondary_media_id) if d.secondary_media_id else None,
            "position": d.position,
        })
    doctors.sort(key=lambda x: (x["position"], x["name"]))
    return doctors


def _query_partners(session):
    partners = [
        {
            "name": p.name,
            "relationship_type": p.relationship_type,
            "badge": p.badge,
            "logo_media_id": str(p.logo_media_id) if p.logo_media_id else None,
            "rights_note": p.rights_note,
            "link_url": p.link_url,
            "position": p.position,
        }
        for p in session.scalars(_live(Partner).where(Partner.active.is_(True))).all()
    ]
    partners.sort(key=lambda x: (x["position"], x["name"]))
    return partners


def _query_quiz(session):
    quiz = session.scalar(
        _live(Quiz).where(Quiz.active.is_(True)).order_by(Quiz.updated_at.desc())
    )
    if quiz is None:
        return None
    questions = []
    for question in session.scalars(
        _live(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.position.asc())
    ).all():
        options = [
            {
                "label": option.label,
                "score": option.score,
                "position": option.position,
            }
            for option in session.scalars(
                _live(QuizOption)
                .where(QuizOption.question_id == question.id)
                .order_by(QuizOption.position.asc())
            ).all()
        ]
        questions.append({
            "prompt": question.prompt,
            "position": question.position,
            "options": options,
        })
    bands = [
        {
            "min_score": band.min_score,
            "max_score": band.max_score,
            "title": band.title,
            "description": band.description,
            "recommendations": band.recommendations,
            "cta_treatment_id": str(band.cta_treatment_id) if band.cta_treatment_id else None,
        }
        for band in session.scalars(
            _live(QuizResultBand)
            .where(QuizResultBand.quiz_id == quiz.id)
            .order_by(QuizResultBand.min_score.asc())
        ).all()
    ]
    return {
        "slug": quiz.slug,
        "title": quiz.title,
        "intro": quiz.intro,
        "questions": questions,
        "result_bands": bands,
    }


def _query_treatments(session):
    categories = {
        cat.id: cat for cat in session.scalars(_live(TreatmentCategory)).all()
    }
    treatments = []
    for t in session.scalars(_live(Treatment).where(Treatment.active.is_(True))).all():
        prices = [
            {"price_kind": pr.price_kind,
             "amount": float(pr.amount) if pr.amount is not None else None,
             "amount_max": float(pr.amount_max) if pr.amount_max is not None else None,
             "old_amount": float(pr.old_amount) if pr.old_amount is not None else None,
             "currency": pr.currency, "note": pr.note,
             "clinic_id": str(pr.clinic_id) if pr.clinic_id else None,
             "position": pr.position}
            for pr in session.scalars(_live(TreatmentPrice).where(TreatmentPrice.treatment_id == t.id)).all()
        ]
        prices.sort(key=lambda x: (x["clinic_id"] or "", x["price_kind"]))
        category = categories.get(t.category_id)
        treatments.append({
            "slug": t.slug, "name": t.name, "summary": t.summary,
            "category_slug": category.slug if category else None,
            "category_label": category.label if category else None,
            "detail_html": render_markdown(t.detail_markdown) if t.detail_markdown else None,
            "prices": prices, "homepage_featured": t.homepage_featured,
            "homepage_label": t.homepage_label, "homepage_icon": t.homepage_icon,
            "position": t.position,
        })
    treatments.sort(key=lambda x: x["slug"])
    return treatments


def _query_offers(session):
    today = date.today().isoformat()
    offers = []
    for o in session.scalars(_live(Offer).where(Offer.status == "active")).all():
        if o.ends_at and o.ends_at < today:
            continue
        features = [f.label for f in sorted(
            session.scalars(_live(OfferFeature).where(OfferFeature.offer_id == o.id)).all(),
            key=lambda f: (f.position, f.label))]
        treatments = [
            {"slug": treatment.slug, "name": treatment.name}
            for treatment in session.scalars(
                select(Treatment)
                .join(OfferTreatment, OfferTreatment.treatment_id == Treatment.id)
                .where(
                    OfferTreatment.offer_id == o.id,
                    Treatment.deleted_at.is_(None),
                    Treatment.active.is_(True),
                )
                .order_by(Treatment.position, Treatment.name)
            ).all()
        ]
        clinics = [
            {"slug": clinic.slug, "name": clinic.name}
            for clinic in session.scalars(
                select(Clinic)
                .join(OfferClinic, OfferClinic.clinic_id == Clinic.id)
                .where(
                    OfferClinic.offer_id == o.id,
                    Clinic.deleted_at.is_(None),
                    Clinic.status == "active",
                )
                .order_by(Clinic.position, Clinic.name)
            ).all()
        ]
        offers.append({
            "slug": o.slug, "name": o.name, "summary": o.summary, "badge": o.badge,
            "price_amount": float(o.price_amount) if o.price_amount is not None else None,
            "old_amount": float(o.old_amount) if o.old_amount is not None else None,
            "currency": o.currency, "starts_at": o.starts_at, "ends_at": o.ends_at,
            "features": features, "treatments": treatments, "clinics": clinics,
            "featured": o.featured, "position": o.position,
        })
    offers.sort(key=lambda x: (x["position"], x["name"]))
    return offers


def _query_articles(session):
    articles = []
    for a in session.scalars(_live(Article).where(Article.status == "published")).all():
        articles.append({
            "slug": a.slug, "title": a.title, "excerpt": a.excerpt,
            "body_html": render_markdown(a.body_markdown) if a.body_markdown else None,
            "cover_media_id": str(a.cover_media_id) if a.cover_media_id else None,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "position": a.position,
        })
    articles.sort(key=lambda x: (x["position"], x["title"]))
    return articles


def _query_news(session):
    news = []
    for n in session.scalars(_live(NewsItem).where(NewsItem.status == "published")).all():
        news.append({
            "slug": n.slug, "title": n.title, "category": n.category, "summary": n.summary,
            "body_html": render_markdown(n.body_markdown) if n.body_markdown else None,
            "media_id": str(n.media_id) if n.media_id else None,
            "event_date": n.event_date.isoformat() if n.event_date else None,
            "published_at": n.published_at.isoformat() if n.published_at else None,
            "position": n.position,
        })
    news.sort(key=lambda x: x["position"])
    return news


def _query_case_studies(session):
    case_studies = []
    rows = session.scalars(
        _live(CaseStudy).where(CaseStudy.consent_state == "approved")
    ).all()
    for case_study in rows:
        treatment = session.get(Treatment, case_study.treatment_id) if case_study.treatment_id else None
        case_studies.append({
            "id": str(case_study.id),
            "title": case_study.title,
            "description": case_study.description,
            "treatment": treatment.name if treatment else None,
            "treatment_id": str(case_study.treatment_id) if case_study.treatment_id else None,
            "clinic_id": str(case_study.clinic_id) if case_study.clinic_id else None,
            "before_media_id": str(case_study.before_media_id) if case_study.before_media_id else None,
            "after_media_id": str(case_study.after_media_id) if case_study.after_media_id else None,
            "disclaimer": case_study.disclaimer,
            "position": case_study.position,
        })
    case_studies.sort(key=lambda item: (item["position"], item["title"]))
    return case_studies


def _query_reviews(session):
    reviews = []
    for r in session.scalars(_live(Review).where(Review.status == "published")).all():
        reviews.append({
            "id": str(r.id), "author": r.author, "rating": r.rating,
            "text_body": r.text_body, "position": r.position,
        })
    reviews.sort(key=lambda x: (x["position"], x["author"]))
    return reviews


def _query_navigation(session):
    page_path_by_id = {p.id: p.path for p in session.scalars(_live(Page)).all()}
    navigation = {}
    for menu in session.scalars(_live(NavigationMenu)).all():
        items = session.scalars(
            _live(NavigationItem).where(NavigationItem.menu_id == menu.id, NavigationItem.enabled.is_(True))
        ).all()
        by_parent = {}
        for it in items:
            by_parent.setdefault(it.parent_id, []).append(it)

        def to_pub(node):
            return {
                "label": node.label,
                "target_path": page_path_by_id.get(node.target_page_id),
                "external_url": node.external_url,
                "position": node.position,
                "children": [to_pub(c) for c in sorted(by_parent.get(node.id, []), key=lambda n: (n.position, n.label))],
            }

        roots = sorted(by_parent.get(None, []), key=lambda n: (n.position, n.label))
        navigation[menu.key] = [to_pub(r) for r in roots]
    return navigation


def _query_links(session):
    links = []
    for link in session.scalars(_live(SiteLink).where(SiteLink.enabled.is_(True))).all():
        links.append({
            "kind": link.kind, "label": link.label, "value": link.value,
            "display_value": link.display_value, "url": link.url, "position": link.position,
        })
    links.sort(key=lambda x: (x["kind"], x["position"], x["label"]))
    return links


def _query_site_texts(session):
    return {
        t.key: t.value
        for t in session.scalars(_live(SiteText)).all()
    }


def _query_site(session):
    state = session.get(SiteState, 1) or SiteState(id=1)
    return {
        "site_name": state.site_name,
        "default_locale": state.default_locale,
        "default_timezone": state.default_timezone,
    }


# ── public endpoints ────────────────────────────────────────────────────────


@public_endpoint
def bootstrap(app, operation, request, **kw):
    with session_scope() as session:
        site = _query_site(session)
        links = _query_links(session)
        navigation = _query_navigation(session)
        clinics_data = _query_clinics(session)
        treatments_data = _query_treatments(session)
        doctors_data = _query_doctors(session)
        partners_data = _query_partners(session)
        homepage_services = _query_homepage_services(session)
        gallery = _query_gallery(session)
        decontat_cas = _query_decontat_cas(session)
        quiz = _query_quiz(session)
        texts = _query_site_texts(session)

    homepage_treatments = [t for t in treatments_data if t.get("homepage_featured")]
    return _json_response({
        "release_version": 1,
        "site": site,
        "links": links,
        "navigation": navigation,
        "clinics": clinics_data,
        "doctors": doctors_data,
        "partners": partners_data,
        "homepage_services": homepage_services,
        "gallery": gallery,
        "decontat_cas": decontat_cas,
        "homepage_treatments": homepage_treatments,
        "quiz": quiz,
        "texts": texts,
    })


@public_endpoint
def page_by_path(app, operation, request, **kw):
    path = flask_request.args.get("path")
    if not path:
        raise NotFoundError("path is required")
    with session_scope() as session:
        page_row = session.scalar(_live(Page).where(Page.enabled.is_(True), Page.path == path))
        if page_row is None:
            raise NotFoundError("page not found")
        sections = [
            {"block_type": s.block_type, "payload": s.payload, "position": s.position}
            for s in session.scalars(_live(PageSection).where(PageSection.page_id == page_row.id)).all()
        ]
        sections.sort(key=lambda s: s["position"])
        seo_row = session.scalar(_live(PageSeo).where(PageSeo.page_id == page_row.id))
        seo = None
        if seo_row is not None:
            seo = {
                "title": seo_row.title, "description": seo_row.description,
                "canonical_path": seo_row.canonical_path,
                "og_media_id": str(seo_row.og_media_id) if seo_row.og_media_id else None,
                "structured_data": seo_row.structured_data,
            }
        page = {
            "path": page_row.path, "route_key": page_row.route_key,
            "template_key": page_row.template_key, "title": page_row.title,
            "indexable": page_row.indexable, "sections": sections, "seo": seo,
        }
    return _json_response({"release_version": 1, "page": page})


@public_endpoint
def articles_list(app, operation, request, **kw):
    with session_scope() as session:
        articles = _query_articles(session)
    summaries = [{k: a.get(k) for k in ("slug", "title", "excerpt", "cover_media_id", "published_at", "position")} for a in articles]
    return _json_response({"release_version": 1, "items": summaries, "total": len(summaries)})


@public_endpoint
def article_detail(app, operation, request, slug=None, **kw):
    with session_scope() as session:
        articles = _query_articles(session)
    match = next((a for a in articles if a.get("slug") == slug), None)
    if match is None:
        raise NotFoundError("article not found")
    return _json_response({"release_version": 1, "article": match})


@public_endpoint
def treatments(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_treatments(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def offers(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_offers(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def reviews(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_reviews(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def clinics(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_clinics(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def sitemap(app, operation, request, **kw):
    with session_scope() as session:
        pages = session.scalars(
            _live(Page).where(Page.enabled.is_(True), Page.indexable.is_(True))
        ).all()
        paths = [p.path for p in pages]
        articles = _query_articles(session)
        news_items = _query_news(session)
    for a in articles:
        paths.append(f"/articole/{a['slug']}")
    for news_item in news_items:
        paths.append(f"/noutati/{news_item['slug']}")
    urls = "".join(f"<url><loc>{p}</loc></url>" for p in sorted(set(paths)))
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    resp = Response(xml, mimetype="application/xml")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@public_endpoint
def news_list(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_news(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def news_detail(app, operation, request, slug=None, **kw):
    with session_scope() as session:
        news_items = _query_news(session)
    match = next((item for item in news_items if item.get("slug") == slug), None)
    if match is None:
        raise NotFoundError("news item not found")
    return _json_response({"release_version": 1, "news_item": match})


@public_endpoint
def case_studies(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_case_studies(session)
    return _json_response({"release_version": 1, "items": data})


@public_endpoint
def legal_document(app, operation, request, doc_type=None, **kw):
    if doc_type not in {"gdpr", "privacy", "terms", "cookies"}:
        raise NotFoundError("legal document not found")
    with session_scope() as session:
        document = session.scalar(
            _live(LegalDocument)
            .where(LegalDocument.doc_type == doc_type, LegalDocument.active.is_(True))
            .order_by(
                LegalDocument.effective_date.desc().nullslast(),
                LegalDocument.approved_at.desc().nullslast(),
                LegalDocument.updated_at.desc(),
            )
        )
        if document is None:
            raise NotFoundError("legal document not found")
        body = {
            "doc_type": document.doc_type,
            "version_label": document.version_label,
            "effective_date": document.effective_date.isoformat() if document.effective_date else None,
            "body_html": render_markdown(document.body_markdown) if document.body_markdown else "",
        }
    return _json_response({"release_version": 1, "legal_document": body})
