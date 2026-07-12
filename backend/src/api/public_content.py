"""Anonymous public read surface — queries the database directly in real time."""
from __future__ import annotations

from datetime import date

from flask import Response, jsonify, make_response
from flask import request as flask_request
from sqlalchemy import select

from src.api._helpers import public_endpoint
from src.catalog.models import Offer, OfferFeature, Treatment, TreatmentCategory, TreatmentPrice
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
from src.editorial.models import Article, NewsItem, Review
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
)


def _live(model):
    return select(model).where(model.deleted_at.is_(None))


def _json_response(body: dict):
    resp = make_response(jsonify(body), 200)
    resp.headers["Cache-Control"] = "no-cache"
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
            "contacts": contacts, "hours": hours, "transit": transit, "faqs": faqs,
        })
    clinics.sort(key=lambda x: x["slug"])
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
            "credentials": d.credentials,
            "portrait_media_id": str(d.portrait_media_id) if d.portrait_media_id else None,
            "position": d.position,
        })
    doctors.sort(key=lambda x: (x["position"], x["name"]))
    return doctors


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
        offers.append({
            "slug": o.slug, "name": o.name, "summary": o.summary, "badge": o.badge,
            "price_amount": float(o.price_amount) if o.price_amount is not None else None,
            "old_amount": float(o.old_amount) if o.old_amount is not None else None,
            "currency": o.currency, "starts_at": o.starts_at, "ends_at": o.ends_at,
            "features": features, "featured": o.featured, "position": o.position,
        })
    offers.sort(key=lambda x: x["slug"])
    return offers


def _query_articles(session):
    articles = []
    for a in session.scalars(_live(Article).where(Article.status == "published")).all():
        articles.append({
            "slug": a.slug, "title": a.title, "excerpt": a.excerpt,
            "body_html": render_markdown(a.body_markdown) if a.body_markdown else None,
            "cover_media_id": str(a.cover_media_id) if a.cover_media_id else None,
            "published_at": a.published_at.isoformat() if a.published_at else None,
        })
    articles.sort(key=lambda x: x["slug"])
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


def _query_reviews(session):
    reviews = []
    for r in session.scalars(_live(Review).where(Review.status == "published")).all():
        reviews.append({
            "author": r.author, "review_date": r.review_date.isoformat(),
            "rating": r.rating, "text_body": r.text_body, "source": r.source,
        })
    reviews.sort(key=lambda x: (x["review_date"], x["author"]), reverse=True)
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
    for l in session.scalars(_live(SiteLink).where(SiteLink.enabled.is_(True))).all():
        links.append({
            "kind": l.kind, "label": l.label, "value": l.value,
            "display_value": l.display_value, "url": l.url, "position": l.position,
        })
    links.sort(key=lambda x: (x["kind"], x["position"], x["label"]))
    return links


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
        homepage_services = _query_homepage_services(session)
        gallery = _query_gallery(session)
        decontat_cas = _query_decontat_cas(session)

    homepage_treatments = [t for t in treatments_data if t.get("homepage_featured")]
    return _json_response({
        "release_version": 1,
        "site": site,
        "links": links,
        "navigation": navigation,
        "clinics": clinics_data,
        "doctors": doctors_data,
        "homepage_services": homepage_services,
        "gallery": gallery,
        "decontat_cas": decontat_cas,
        "homepage_treatments": homepage_treatments,
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
    summaries = [{k: a.get(k) for k in ("slug", "title", "excerpt", "cover_media_id", "published_at")} for a in articles]
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
    for a in articles:
        paths.append(f"/articole/{a['slug']}")
    urls = "".join(f"<url><loc>{p}</loc></url>" for p in sorted(set(paths)))
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    resp = Response(xml, mimetype="application/xml")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@public_endpoint
def news_list(app, operation, request, **kw):
    with session_scope() as session:
        data = _query_news(session)
    return _json_response({"items": data})
