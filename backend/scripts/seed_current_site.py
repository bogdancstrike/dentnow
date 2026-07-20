"""Seed the audited current website into an initial workspace + migration_baseline
publication. Idempotent: re-running on an already-seeded database is a no-op.

Content is migrated for RENDERING PARITY only — it is NOT medically, commercially, or
legally certified. Unverified records are marked ``needs_review``. The one auditable
``migration_baseline`` publication is created only on a completely empty database.
"""
from __future__ import annotations

import json
import html
import re
import sys
import uuid
from datetime import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select  # noqa: E402

import src.models_all  # noqa: E402,F401
from src.catalog.models import (  # noqa: E402
    Offer, OfferFeature, Partner, Technology, Treatment, TreatmentCategory, TreatmentFaq,
    TreatmentPrice,
)
from src.clinics.models import (  # noqa: E402
    Clinic, ClinicContact, ClinicFaq, ClinicHours, ClinicTransitItem, Doctor,
)
from src.core.clock import utcnow, uuid7  # noqa: E402
from src.core.db import session_scope  # noqa: E402
from src.editorial.models import (  # noqa: E402
    Article, CaseStudy, Ebook, LegalDocument, NewsItem, Quiz, QuizOption, QuizQuestion,
    QuizResultBand, Review,
)
from src.iam.capabilities import ROLE_ADMIN  # noqa: E402
from src.iam.principal import Principal  # noqa: E402
from src.media.models import PublicationMedia  # noqa: E402
from src.media.service import MediaService  # noqa: E402
from src.site.models import (  # noqa: E402
    CasFaq, CasStep, GalleryImage, HomepageService, NavigationItem, NavigationMenu, Page,
    PageSection, PageSeo, SiteLink, SiteState, SitePublication, SiteText,
)

SEEDS = Path(__file__).resolve().parents[1] / "seeds"
WEEKDAY_ORDER = {"Luni – Vineri": None, "Sâmbătă": 5, "Duminică": 6}
ROUTES = [
    ("/", "home", "home", "DentNow — Clinică Stomatologică București"),
    ("/tratamente", "treatments", "treatment-index", "Tratamente & Tarife"),
    ("/oferte", "offers", "offers-index", "Oferte"),
    ("/articole", "articles", "article-index", "Articole"),
    ("/recenzii", "reviews", "generic", "Recenzii"),
    ("/recenzie", "review-redirect", "generic", "Lasă o recenzie"),
    ("/before-after", "before-after", "generic", "Before & After"),
    ("/noutati", "news", "article-index", "Noutăți"),
    ("/scor-igiena", "quiz", "quiz", "Scor Igienă Orală"),
    ("/parteneri", "partners", "generic", "Parteneri"),
    ("/ebook", "ebooks", "generic", "E-Bookuri"),
    ("/decontat-cas", "cas", "generic", "Decontat CAS"),
    ("/urgente-dentare-bucuresti", "emergency", "generic", "Urgențe Dentare"),
    ("/gdpr", "gdpr", "legal", "GDPR"),
    ("/confidentialitate", "privacy", "legal", "Confidențialitate"),
    ("/termeni", "terms", "legal", "Termeni și Condiții"),
    ("/stomatologie-dristor", "clinic-dristor", "clinic-detail", "Stomatologie Dristor"),
    ("/stomatologie-baba-novac", "clinic-baba-novac", "clinic-detail", "Stomatologie Baba Novac"),
    ("/stomatologie-prelungirea-ghencea", "clinic-prelungirea-ghencea", "clinic-detail", "Stomatologie Prelungirea Ghencea"),
]


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return re.sub(r"-+", "-", s).strip("-")[:110] or "item"


def _parse_price(raw: str):
    """Map a display price string to (kind, amount, amount_max)."""
    t = (raw or "").lower()
    if "cerere" in t:
        return "on_request", None, None
    nums = [int(n.replace(".", "")) for n in re.findall(r"\d[\d.]*", t)]
    if "de la" in t and nums:
        return "from", nums[0], None
    if ("–" in raw or "-" in raw) and len(nums) >= 2:
        return "range", nums[0], nums[1]
    if nums:
        return "exact", nums[0], None
    return "on_request", None, None


def _legacy_html_to_markdown(raw: str | None) -> str | None:
    """Turn the audited legacy article fragments into safe Markdown for the CMS.

    The old frontend stored a small, fixed subset of HTML. Keeping it as
    ``body_markdown`` would make the Markdown renderer escape tags visibly, so the
    seed normalizes paragraphs, breaks, emphasis and list-like bullets once.
    """
    if not raw:
        return None
    value = raw
    value = re.sub(r"<\s*br\s*/?\s*>", "\n", value, flags=re.I)
    value = re.sub(r"<\s*/?\s*strong\s*>", "**", value, flags=re.I)
    value = re.sub(r"<\s*/?\s*em\s*>", "_", value, flags=re.I)
    value = re.sub(r"<\s*/\s*p\s*>", "\n\n", value, flags=re.I)
    value = re.sub(r"<\s*p(?:\s+[^>]*)?>", "", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value).replace("• ", "- ")
    return re.sub(r"\n{3,}", "\n\n", value).strip()


def _legal_to_markdown(sections: list[dict] | None) -> str:
    if not sections:
        return ""
    md = []
    for s in sections:
        if s.get("title"):
            md.append(f"## {s['title']}\n")
        for p in s.get("paragraphs", []):
            md.append(f"{p}\n")
        if s.get("list"):
            for li in s["list"]:
                md.append(f"- {li}")
            md.append("")
    return "\n".join(md).strip()


def _hours(raw: str | None) -> tuple[time | None, time | None]:
    matches = re.findall(r"(\d{1,2}):(\d{2})", raw or "")
    if len(matches) < 2:
        return None, None
    return time(int(matches[0][0]), int(matches[0][1])), time(int(matches[1][0]), int(matches[1][1]))


def _weekdays(label: str) -> list[int]:
    if "Luni" in label and "Vineri" in label:
        return [0, 1, 2, 3, 4]
    return {"Sâmbătă": [5], "Duminică": [6]}.get(label, [0])


def seed_placeholder_media(session) -> uuid.UUID:
    """Upload the canonical temporary photo through the real MinIO media path."""
    principal = Principal(subject="seed", roles=frozenset({ROLE_ADMIN}))
    result = MediaService(session, principal).upload_image(
        (SEEDS / "assets" / "og-dentnow.png").read_bytes(),
        filename="dentnow-placeholder.png",
        alt_text="Imagine temporară DentNow — va fi înlocuită din administrare",
        rights_note="Generated migration placeholder; not patient imagery",
    )
    return uuid.UUID(result["id"])


def already_seeded(session) -> bool:
    return session.scalar(select(Clinic.id).limit(1)) is not None


def seed(session, data: dict, placeholder_media_id: uuid.UUID) -> dict:
    counts: dict[str, int] = {}

    # ── site state ─────────────────────────────────────────────────────────
    state = session.get(SiteState, 1) or SiteState(id=1)
    state.site_name = data["site"]["name"]
    state.default_locale = data["site"].get("locale", "ro-RO")
    state.default_timezone = data["site"].get("timezone", "Europe/Bucharest")
    session.merge(state)

    # ── public copy ─────────────────────────────────────────────────────────
    for key, value in data.get("siteTexts", {}).items():
        session.add(SiteText(key=key, value=value))
    counts["site_texts"] = len(data.get("siteTexts", {}))

    # ── clinics (+ contacts, hours) ──────────────────────────────────────────
    clinic_ids = []
    for pos, c in enumerate(data["clinics"]):
        clinic_slug = c.get("slug") or _slug(c["name"].removeprefix("DentNow "))
        postal_match = re.search(r"\b\d{6}\b", c.get("address", ""))
        clinic = Clinic(
            slug=clinic_slug, name=c["name"], area=c.get("area"),
            address_full=c.get("address"), map_link_url=c.get("mapsLink"),
            map_embed_url=c.get("embedUrl"), postal_code=postal_match.group(0) if postal_match else None,
            status="active", position=pos,
        )
        session.add(clinic)
        session.flush()
        clinic_ids.append(clinic.id)
        session.add(ClinicContact(
            clinic_id=clinic.id, kind="phone", display_value=c["phoneDisplay"],
            normalized_value=re.sub(r"[^\d+]", "", c["phone"]), url=f"tel:{c['phone']}",
            label="Programări", is_primary=True, position=0,
        ))
        session.add(ClinicContact(
            clinic_id=clinic.id, kind="whatsapp", display_value="WhatsApp",
            normalized_value=re.sub(r"[^\d+]", "", c["phone"]),
            url=f"https://wa.me/{re.sub(r'[^\d]', '', c['phone'])}", label="WhatsApp", position=1,
        ))
        for h in c.get("schedule", []):
            opens_at, closes_at = _hours(h.get("hours"))
            for weekday in _weekdays(h["day"]):
                session.add(ClinicHours(
                    clinic_id=clinic.id, weekday=weekday, opens_at=opens_at, closes_at=closes_at,
                    closed=not h.get("open", True),
                ))
        for transit_position, transit in enumerate(c.get("transit", [])):
            session.add(ClinicTransitItem(
                clinic_id=clinic.id,
                mode=transit.get("mode"),
                label=transit.get("label") or transit.get("mode") or "Transport",
                detail=transit.get("detail"),
                position=transit_position,
            ))
        for faq_position, faq in enumerate(c.get("faqs", [])):
            session.add(ClinicFaq(
                clinic_id=clinic.id,
                question=faq["question"],
                answer=faq["answer"],
                position=faq_position,
            ))
    counts["clinics"] = len(clinic_ids)
    counts["phone_lines"] = len({c["phone"] for c in data["clinics"]})
    counts["clinic_transit_items"] = sum(len(c.get("transit", [])) for c in data["clinics"])
    counts["clinic_faqs"] = sum(len(c.get("faqs", [])) for c in data["clinics"])

    # ── links ────────────────────────────────────────────────────────────────
    for i, ph in enumerate(data.get("phones", [])):
        session.add(SiteLink(kind="phone", label=ph["label"], value=ph["tel"],
                             display_value=ph["display"], url=f"tel:{ph['tel']}", position=i))
    contact = data.get("contact", {})
    if contact.get("email"):
        session.add(SiteLink(kind="email", label="Email", value=contact["email"],
                             display_value=contact["email"], url=f"mailto:{contact['email']}"))
    if contact.get("whatsappUrl"):
        session.add(SiteLink(kind="whatsapp", label="WhatsApp", value=contact["whatsappUrl"],
                             display_value="WhatsApp", url=contact["whatsappUrl"]))
    social = data.get("social", {})
    for k in ("facebook", "instagram", "linkedin", "website"):
        if social.get(k):
            session.add(SiteLink(kind="social", label=k, value=social[k]))
    if data["contact"].get("reviewsUrl"):
        session.add(SiteLink(kind="review", label="Google", value=data["contact"]["reviewsUrl"]))

    # ── homepage service cards + service treatments ──────────────────────────
    for position, service_data in enumerate(data["services"]):
        homepage_service = session.scalar(
            select(HomepageService).where(
                HomepageService.position == position,
                HomepageService.deleted_at.is_(None),
            )
        )
        if homepage_service is None:
            homepage_service = HomepageService(position=position)
            session.add(homepage_service)
        homepage_service.title = service_data["title"]
        homepage_service.description = service_data.get("desc")
        homepage_service.icon = service_data.get("icon")
        homepage_service.link = service_data.get("link")
        homepage_service.active = True

    for i, s in enumerate(data["services"]):
        session.add(Treatment(slug=f"service-{i}-{_slug(s['title'])}", name=s["title"],
                             summary=s.get("desc"), active=True, position=i))
    counts["services"] = len(data["services"])
    counts["homepage_services"] = len(data["services"])

    # ── categories (10) + prices (20) ────────────────────────────────────────
    price_rows = 0
    quick_by_category = {
        item.get("link", "").partition("#")[2]: item
        for item in data.get("quickServices", [])
        if "#" in item.get("link", "")
    }
    detail_by_category = {
        detail["category_id"]: detail
        for detail in data.get("treatmentDetails", {}).values()
    }
    treatment_faq_count = 0
    detailed_treatment_count = 0
    for pos, cat in enumerate(data["treatmentCategories"]):
        category = TreatmentCategory(slug=_slug(cat["id"]), label=cat["title"], position=pos)
        session.add(category)
        session.flush()
        for j, row in enumerate(cat["rows"]):
            quick = quick_by_category.get(cat["id"]) if j == 0 else None
            detail = detail_by_category.get(cat["id"]) if j == 0 else None
            t = Treatment(
                slug=detail["slug"] if detail else f"cat-{cat['id']}-{j}",
                name=row["name"], category_id=category.id,
                summary=detail.get("seo", {}).get("description") if detail else None,
                detail_markdown=detail.get("detail_markdown") if detail else None,
                homepage_featured=quick is not None,
                homepage_label=quick.get("label") if quick else None,
                homepage_icon=quick.get("icon") if quick else None,
                position=j,
            )
            session.add(t)
            session.flush()
            if detail:
                detailed_treatment_count += 1
                for faq_position, faq in enumerate(detail.get("faqs", [])):
                    session.add(TreatmentFaq(
                        treatment_id=t.id,
                        question=faq["question"],
                        answer=faq["answer"],
                        position=faq_position,
                    ))
                    treatment_faq_count += 1
            kind, amount, amount_max = _parse_price(row.get("price", ""))
            _old_kind, old_amount, _old_max = _parse_price(row.get("oldPrice", ""))
            session.add(TreatmentPrice(
                treatment_id=t.id, price_kind=kind, amount=amount, amount_max=amount_max,
                old_amount=old_amount, currency="RON", note=row.get("price"), position=j,
            ))
            price_rows += 1
    counts["treatment_categories"] = len(data["treatmentCategories"])
    counts["treatment_price_rows"] = price_rows
    counts["detailed_treatments"] = detailed_treatment_count
    counts["treatment_faqs"] = treatment_faq_count

    # ── offers (6) + features ────────────────────────────────────────────────
    for pos, o in enumerate(data["offers"]):
        kind, amount, _m = _parse_price(o.get("price", ""))
        _old_kind, old_amount, _old_max = _parse_price(o.get("oldPrice", ""))
        offer = Offer(slug=_slug(o["name"]), name=o["name"], summary=o.get("desc"),
                      badge=o.get("badge"), price_amount=amount, old_amount=old_amount, currency="RON",
                      status="active", featured=bool(o.get("featured")), position=pos)
        session.add(offer)
        session.flush()
        for fi, feat in enumerate(o.get("features", [])):
            session.add(OfferFeature(offer_id=offer.id, label=feat, position=fi))
    counts["offers"] = len(data["offers"])

    # ── partners (6) ─────────────────────────────────────────────────────────
    for pos, p in enumerate(data["partners"]):
        session.add(Partner(name=p["name"], relationship_type=p.get("type"), badge=p.get("badge"),
                            logo_media_id=placeholder_media_id, position=pos))
    counts["partners"] = len(data["partners"])

    # ── doctors ──────────────────────────────────────────────────────────────
    for pos, d in enumerate(data.get("doctors", [])):
        session.add(Doctor(slug=_slug(d["name"] + f"-{pos}"), name=d["name"], role=d.get("role"),
                          focus=d.get("focus"), portrait_media_id=placeholder_media_id,
                          active=True, position=pos))

    # ── technology cards use the same replaceable MinIO placeholder ─────────
    for pos, t in enumerate(data.get("technologies", [])):
        session.add(Technology(name=t["title"], description=t.get("text"),
                               media_id=placeholder_media_id, active=True, position=pos))
    counts["technologies"] = len(data.get("technologies", []))

    # ── ebooks (6) ───────────────────────────────────────────────────────────
    for pos, e in enumerate(data["ebooks"]):
        session.add(Ebook(slug=_slug(e["label"]), title=e["title"], category=e.get("cat"),
                        description=e.get("desc"), cover_media_id=placeholder_media_id,
                        active=True, position=pos))
    counts["ebooks"] = len(data["ebooks"])

    # ── news (3) ─────────────────────────────────────────────────────────────
    for pos, n in enumerate(data["newsItems"]):
        session.add(NewsItem(slug=_slug(n["title"]), title=n["title"],
                          category=n.get("cat"), media_id=placeholder_media_id,
                          status="published", published_at=utcnow().date(), position=pos))
    counts["news_items"] = len(data["newsItems"])

    # ── reviews (9) ──────────────────────────────────────────────────────────
    for pos, r in enumerate(data["reviews"]):
        session.add(Review(author=r.get("author", "Anonim"), review_date=utcnow().date(),
                        rating=int(r.get("rating", 5)), text_body=r.get("text"),
                        source="google", source_url=data.get("contact", {}).get("reviewsUrl"),
                        status="published", position=pos))
    counts["reviews"] = len(data["reviews"])

    # ── articles (17) ────────────────────────────────────────────────────────
    for pos, a in enumerate(data["articles"]):
        session.add(Article(slug=_slug(a["title"]), title=a["title"],
                          category=a.get("cat"), excerpt=a.get("excerpt"),
                          body_markdown=_legacy_html_to_markdown(a.get("body")),
                          cover_media_id=placeholder_media_id, author="Echipa DentNow",
                          published_at=utcnow().date(), status="published", position=pos))
    counts["articles"] = len(data["articles"])

    # ── case studies (3) ─────────────────────────────────────────────────────
    for pos, c in enumerate(data["beforeAfterCases"]):
        session.add(CaseStudy(title=c["title"], description=c.get("desc"),
                           before_media_id=placeholder_media_id, after_media_id=placeholder_media_id,
                           disclaimer=c.get("desc"), consent_state="none", position=pos))
    counts["case_studies"] = len(data["beforeAfterCases"])

    # ── quiz (1) + questions (7) + options (28) ──────────────────────────────
    quiz = Quiz(slug="scor-igiena", title="Scor Igienă Orală", active=True)
    session.add(quiz)
    session.flush()
    qcount = ocount = 0
    for qi, q in enumerate(data["quizQuestions"]):
        question = QuizQuestion(quiz_id=quiz.id, prompt=q["q"], position=qi)
        session.add(question)
        session.flush()
        qcount += 1
        for oi, opt in enumerate(q["opts"]):
            session.add(QuizOption(question_id=question.id, label=opt[0], score=int(opt[1]), position=oi))
            ocount += 1
    counts["quiz_questions"] = qcount
    counts["quiz_options"] = ocount
    for band in data.get("quizResultBands", []):
        session.add(QuizResultBand(quiz_id=quiz.id, **band))
    counts["quiz_result_bands"] = len(data.get("quizResultBands", []))

    # ── gallery + decontat CAS structured content ────────────────────────────
    for position, gallery_data in enumerate(data.get("gallery", [])):
        gallery_image = session.scalar(
            select(GalleryImage).where(
                GalleryImage.position == position,
                GalleryImage.deleted_at.is_(None),
            )
        )
        if gallery_image is None:
            gallery_image = GalleryImage(position=position)
            session.add(gallery_image)
        gallery_image.media_id = None
        gallery_image.image_url = gallery_data.get("src")
        gallery_image.title = gallery_data["title"]
        gallery_image.caption = gallery_data.get("caption")
        gallery_image.alt_text = gallery_data.get("alt")
        gallery_image.active = True
    counts["gallery_images"] = len(data.get("gallery", []))

    for position, step_data in enumerate(data.get("cas", {}).get("steps", [])):
        step = session.scalar(
            select(CasStep).where(CasStep.position == position, CasStep.deleted_at.is_(None))
        )
        if step is None:
            step = CasStep(position=position)
            session.add(step)
        step.title = step_data["title"]
        step.text = step_data.get("text")
        step.active = True
    counts["cas_steps"] = len(data.get("cas", {}).get("steps", []))

    for position, faq_data in enumerate(data.get("cas", {}).get("faqs", [])):
        faq = session.scalar(
            select(CasFaq).where(CasFaq.position == position, CasFaq.deleted_at.is_(None))
        )
        if faq is None:
            faq = CasFaq(position=position)
            session.add(faq)
        faq.question = faq_data["q"]
        faq.answer = faq_data["a"]
        faq.active = True
    counts["cas_faqs"] = len(data.get("cas", {}).get("faqs", []))

    # ── legal (migration baseline) ───────────────────────────────────────────
    legal_data = data.get("legal", {})
    for t in ("gdpr", "privacy", "terms"):
        body = _legal_to_markdown(legal_data.get(t))
        if not body:
            body = f"{t} placeholder — needs review."
        session.add(LegalDocument(doc_type=t, version_label="migration-baseline",
                               effective_date=utcnow().date(), body_markdown=body,
                               approved_by="seed-import", approved_at=utcnow(), active=True))

    # ── pages (route inventory + page-local sections/SEO) ───────────────────
    pages_by_path = {}
    clinic_data_by_slug = {clinic["slug"]: clinic for clinic in data["clinics"]}
    treatment_details = data.get("treatmentDetails", {})
    page_content = data.get("pageContent", {})
    for path_, key, template, title in ROUTES:
        page = Page(path=path_, route_key=key, template_key=template, title=title,
                    enabled=True,
                    indexable=path_ != "/recenzie" and not path_.startswith(("/gdpr", "/confid", "/termeni")))
        session.add(page)
        session.flush()
        pages_by_path[path_] = page

        authored = page_content.get(path_)
        treatment_detail = treatment_details.get(path_)
        clinic_data = None
        if path_.startswith("/stomatologie-"):
            clinic_data = clinic_data_by_slug.get(path_.removeprefix("/stomatologie-"))

        seo_data = data.get("pageSeo", {}).get(path_)
        sections: list[dict] = []
        if authored:
            seo_data = authored.get("seo") or seo_data
            sections.extend(authored.get("sections", []))
            if path_ == "/":
                sections.extend([
                    {"block_type": "trust_stats", "payload": {"items": data.get("trustStats", [])}},
                    {"block_type": "patient_journey", "payload": {"items": data.get("patientJourney", [])}},
                    {"block_type": "footer_intro", "payload": {
                        "description": data.get("footer", {}).get("description", ""),
                    }},
                ])
        elif treatment_detail:
            seo_data = treatment_detail.get("seo") or seo_data
            sections.extend([
                {"block_type": "treatment_hero", "payload": treatment_detail.get("hero", {})},
                {"block_type": "treatment_overview", "payload": {"text": treatment_detail.get("overview", "")}},
                {"block_type": "treatment_benefits", "payload": {"items": treatment_detail.get("benefits", [])}},
            ])
        elif clinic_data:
            seo_data = clinic_data.get("seo") or seo_data
            sections.append({
                "block_type": "clinic_intro",
                "payload": {"subtitle": clinic_data.get("subtitle", "")},
            })

        if seo_data:
            session.add(PageSeo(
                page_id=page.id,
                title=seo_data.get("title"),
                description=seo_data.get("description"),
                canonical_path=path_,
            ))
        for section_position, section_data in enumerate(sections):
            session.add(PageSection(
                page_id=page.id,
                block_type=section_data["block_type"],
                payload=section_data.get("payload", {}),
                position=section_position,
            ))

    counts["pages"] = len(pages_by_path)
    counts["page_seo"] = sum(
        1 for path_, *_rest in ROUTES
        if path_ in page_content
        or path_ in treatment_details
        or path_.startswith("/stomatologie-")
        or path_ in data.get("pageSeo", {})
    )
    route_paths = {path_ for path_, *_rest in ROUTES}
    counts["page_sections"] = sum(
        len(content.get("sections", [])) + (3 if path_ == "/" else 0)
        for path_, content in page_content.items()
    ) + (3 * sum(path_ in route_paths for path_ in treatment_details)) + len(clinic_data_by_slug)

    # ── public navigation comes from the seed/database, including nested items ─
    navigation_count = 0
    for menu_key in ("desktop", "mobile"):
        menu = NavigationMenu(key=menu_key, label=menu_key.capitalize())
        session.add(menu)
        session.flush()

        def add_nav_items(items, parent_id=None):
            nonlocal navigation_count
            for position, item in enumerate(items):
                target = item.get("to")
                page = pages_by_path.get(target) if target and "#" not in target else None
                nav = NavigationItem(
                    menu_id=menu.id, parent_id=parent_id, label=item["label"], position=position,
                    target_page_id=page.id if page else None,
                    external_url=None if page else target,
                )
                session.add(nav)
                session.flush()
                navigation_count += 1
                add_nav_items(item.get("children", []), nav.id)

        add_nav_items(data.get("navigation", {}).get(menu_key, []))
    counts["navigation_items"] = navigation_count
    counts["media_assets"] = 1

    session.flush()
    return counts


def create_seed_publication(session, reason: str) -> str:
    """Create and activate a snapshot produced by a trusted seed command."""
    from src.site.snapshot_builder import build_snapshot, content_hash

    snapshot = build_snapshot(session)
    chash = content_hash(snapshot)
    state = session.get(SiteState, 1)
    if state is None:
        raise RuntimeError("site state missing before baseline publication")
    next_version = (session.scalar(select(func.max(SitePublication.version))) or 0) + 1
    pub = SitePublication(
        id=uuid7(), version=next_version, workspace_version=state.workspace_version,
        snapshot=snapshot.model_dump(mode="json"), content_hash=chash,
        activation_reason=reason, created_by="seed",
    )
    session.add(pub)
    session.flush()
    for asset_id in snapshot.media.keys():
        session.add(PublicationMedia(publication_id=pub.id, asset_id=uuid.UUID(asset_id)))
    state.active_publication_id = pub.id
    session.flush()
    return str(pub.id)


def create_migration_baseline(session) -> str:
    """Create the one auditable migration_baseline publication (empty DB only)."""
    return create_seed_publication(session, "migration_baseline")


def main() -> int:
    data = json.loads((SEEDS / "current-site.json").read_text())
    data["siteTexts"] = json.loads((SEEDS / "site-texts.json").read_text())
    data["quizResultBands"] = json.loads((SEEDS / "quiz-result-bands.json").read_text())
    data["pageSeo"] = json.loads((SEEDS / "page-seo.json").read_text())
    with session_scope() as session:
        if already_seeded(session):
            print("seed: already seeded — no changes")
            return 0
        placeholder_media_id = seed_placeholder_media(session)
        counts = seed(session, data, placeholder_media_id)
        pub_id = create_migration_baseline(session)
        print(f"seed: created baseline workspace + migration_baseline publication {pub_id}")
        print("seed: counts " + json.dumps(counts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
