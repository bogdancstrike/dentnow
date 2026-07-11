"""Deterministic workspace -> SiteSnapshotV1 builder + canonical hashing.

All unordered collections are sorted by stable business keys so the same workspace
always produces byte-identical canonical JSON (and thus the same content hash).
Expired offers are excluded even if an editor forgot to disable them.
"""
from __future__ import annotations

import hashlib
import json
from datetime import date

from sqlalchemy import select

from src.catalog.models import Offer, OfferFeature, Treatment, TreatmentPrice
from src.clinics.models import Clinic, ClinicContact, ClinicHours
from src.editorial.models import Article, Review
from src.editorial.rich_text import render_markdown
from src.media.models import MediaAsset, MediaVariant
from src.site.models import (
    NavigationItem,
    NavigationMenu,
    Page,
    PageSection,
    PageSeo,
    SiteLink,
    SiteState,
)
from src.site.snapshot_contract import (
    ArticlePublic,
    ClinicPublic,
    EditorialPublic,
    LinkPublic,
    MediaPublic,
    NavigationItemPublic,
    OfferPublic,
    PagePublic,
    ReviewPublic,
    SectionPublic,
    SeoPublic,
    SitePublic,
    SiteSnapshotV1,
    TreatmentPublic,
)


def _live(model):
    return select(model).where(model.deleted_at.is_(None))


def build_snapshot(session) -> SiteSnapshotV1:
    state = session.get(SiteState, 1) or SiteState(id=1)
    media_ids: set[str] = set()

    # ── links ────────────────────────────────────────────────────────────────
    links = [
        LinkPublic(kind=l.kind, label=l.label, value=l.value, display_value=l.display_value,
                   url=l.url, position=l.position)
        for l in session.scalars(_live(SiteLink).where(SiteLink.enabled.is_(True))).all()
    ]
    links.sort(key=lambda x: (x.kind, x.position, x.label))

    # ── navigation (menu key -> ordered item tree) ─────────────────────────────
    page_path_by_id = {p.id: p.path for p in session.scalars(_live(Page)).all()}
    navigation: dict[str, list[NavigationItemPublic]] = {}
    for menu in session.scalars(_live(NavigationMenu)).all():
        items = session.scalars(
            _live(NavigationItem).where(NavigationItem.menu_id == menu.id, NavigationItem.enabled.is_(True))
        ).all()
        by_parent: dict = {}
        for it in items:
            by_parent.setdefault(it.parent_id, []).append(it)

        def to_pub(node):
            return NavigationItemPublic(
                label=node.label,
                target_path=page_path_by_id.get(node.target_page_id),
                external_url=node.external_url,
                position=node.position,
                children=[to_pub(c) for c in sorted(by_parent.get(node.id, []), key=lambda n: (n.position, n.label))],
            )

        roots = sorted(by_parent.get(None, []), key=lambda n: (n.position, n.label))
        navigation[menu.key] = [to_pub(r) for r in roots]

    # ── clinics ────────────────────────────────────────────────────────────────
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
        clinics.append(ClinicPublic(
            slug=c.slug, name=c.name, area=c.area, address_full=c.address_full,
            latitude=float(c.latitude) if c.latitude is not None else None,
            longitude=float(c.longitude) if c.longitude is not None else None,
            map_embed_url=c.map_embed_url, map_link_url=c.map_link_url, contacts=contacts, hours=hours,
        ))
    clinics.sort(key=lambda x: x.slug)

    # ── pages (by path) with sections + seo ────────────────────────────────────
    pages_by_path: dict[str, PagePublic] = {}
    for p in session.scalars(_live(Page).where(Page.enabled.is_(True))).all():
        sections = [
            SectionPublic(block_type=s.block_type, payload=s.payload, position=s.position)
            for s in session.scalars(_live(PageSection).where(PageSection.page_id == p.id)).all()
        ]
        sections.sort(key=lambda s: s.position)
        seo_row = session.scalar(_live(PageSeo).where(PageSeo.page_id == p.id))
        seo = None
        if seo_row is not None:
            if seo_row.og_media_id:
                media_ids.add(str(seo_row.og_media_id))
            seo = SeoPublic(title=seo_row.title, description=seo_row.description,
                            canonical_path=seo_row.canonical_path,
                            og_media_id=str(seo_row.og_media_id) if seo_row.og_media_id else None,
                            structured_data=seo_row.structured_data)
        pages_by_path[p.path] = PagePublic(
            path=p.path, route_key=p.route_key, template_key=p.template_key, title=p.title,
            indexable=p.indexable, sections=sections, seo=seo,
        )

    # ── treatments + prices ────────────────────────────────────────────────────
    treatments = []
    for t in session.scalars(_live(Treatment).where(Treatment.active.is_(True))).all():
        prices = [
            {"price_kind": pr.price_kind, "amount": float(pr.amount) if pr.amount is not None else None,
             "amount_max": float(pr.amount_max) if pr.amount_max is not None else None,
             "currency": pr.currency, "note": pr.note, "clinic_id": str(pr.clinic_id) if pr.clinic_id else None}
            for pr in session.scalars(_live(TreatmentPrice).where(TreatmentPrice.treatment_id == t.id)).all()
        ]
        prices.sort(key=lambda x: (x["clinic_id"] or "", x["price_kind"]))
        treatments.append(TreatmentPublic(
            slug=t.slug, name=t.name, summary=t.summary,
            detail_html=render_markdown(t.detail_markdown) if t.detail_markdown else None, prices=prices,
        ))
    treatments.sort(key=lambda x: x.slug)

    # ── offers (exclude expired) ───────────────────────────────────────────────
    today = date.today().isoformat()
    offers = []
    for o in session.scalars(_live(Offer).where(Offer.status == "active")).all():
        if o.ends_at and o.ends_at < today:
            continue  # expired -> excluded from the snapshot
        features = [f.label for f in sorted(
            session.scalars(_live(OfferFeature).where(OfferFeature.offer_id == o.id)).all(),
            key=lambda f: (f.position, f.label))]
        offers.append(OfferPublic(
            slug=o.slug, name=o.name, summary=o.summary, badge=o.badge,
            price_amount=float(o.price_amount) if o.price_amount is not None else None,
            currency=o.currency, starts_at=o.starts_at, ends_at=o.ends_at, features=features,
        ))
    offers.sort(key=lambda x: x.slug)

    # ── editorial ──────────────────────────────────────────────────────────────
    articles = []
    for a in session.scalars(_live(Article).where(Article.status == "published")).all():
        if a.cover_media_id:
            media_ids.add(str(a.cover_media_id))
        articles.append(ArticlePublic(
            slug=a.slug, title=a.title, excerpt=a.excerpt,
            body_html=render_markdown(a.body_markdown) if a.body_markdown else None,
            cover_media_id=str(a.cover_media_id) if a.cover_media_id else None,
            published_at=a.published_at.isoformat() if a.published_at else None,
        ))
    articles.sort(key=lambda x: x.slug)

    reviews = [
        ReviewPublic(author=r.author, review_date=r.review_date.isoformat(), rating=r.rating,
                     text_body=r.text_body, source=r.source)
        for r in session.scalars(_live(Review).where(Review.status == "published")).all()
    ]
    reviews.sort(key=lambda x: (x.review_date, x.author), reverse=True)

    # ── media referenced by the snapshot ───────────────────────────────────────
    media: dict[str, MediaPublic] = {}
    for asset_id in sorted(media_ids):
        try:
            import uuid as _uuid
            asset = session.get(MediaAsset, _uuid.UUID(asset_id))
        except Exception:
            asset = None
        if asset is None or asset.deleted_at is not None:
            continue
        variants = sorted(
            v.variant for v in session.scalars(select(MediaVariant).where(MediaVariant.asset_id == asset.id)).all()
        )
        media[asset_id] = MediaPublic(asset_id=asset_id, variants=variants, alt_text=asset.alt_text)

    return SiteSnapshotV1(
        site=SitePublic(site_name=state.site_name, default_locale=state.default_locale,
                        default_timezone=state.default_timezone),
        links=links, navigation=navigation, clinics=clinics, pages_by_path=pages_by_path,
        treatments=treatments, offers=offers,
        editorial=EditorialPublic(articles=articles, reviews=reviews), media=media,
    )


def canonical_json(snapshot: SiteSnapshotV1) -> str:
    """Deterministic canonical JSON (sorted keys, compact separators)."""
    return json.dumps(snapshot.model_dump(mode="json"), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def content_hash(snapshot: SiteSnapshotV1) -> str:
    return hashlib.sha256(canonical_json(snapshot).encode("utf-8")).hexdigest()
