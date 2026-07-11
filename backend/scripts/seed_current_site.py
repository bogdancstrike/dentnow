"""Seed the audited current website into an initial workspace + migration_baseline
publication. Idempotent: re-running on an already-seeded database is a no-op.

Content is migrated for RENDERING PARITY only — it is NOT medically, commercially, or
legally certified. Unverified records are marked ``needs_review``. The one auditable
``migration_baseline`` publication is created only on a completely empty database.
"""
from __future__ import annotations

import json
import re
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import src.models_all  # noqa: E402,F401
from src.catalog.models import (  # noqa: E402
    Offer, OfferFeature, Partner, Treatment, TreatmentCategory, TreatmentPrice,
)
from src.clinics.models import Clinic, ClinicContact, ClinicHours, Doctor  # noqa: E402
from src.core.clock import utcnow, uuid7  # noqa: E402
from src.core.db import session_scope  # noqa: E402
from src.editorial.models import (  # noqa: E402
    Article, CaseStudy, Ebook, LegalDocument, NewsItem, Quiz, QuizOption, QuizQuestion, Review,
)
from src.site.models import Page, SiteLink, SiteState, SitePublication  # noqa: E402

SEEDS = Path(__file__).resolve().parents[1] / "seeds"
WEEKDAY_ORDER = {"Luni – Vineri": None, "Sâmbătă": 5, "Duminică": 6}
ROUTES = [
    ("/", "home", "home", "DentNow — Clinică Stomatologică București"),
    ("/tratamente", "treatments", "treatment-index", "Tratamente & Tarife"),
    ("/oferte", "offers", "offers-index", "Oferte"),
    ("/articole", "articles", "article-index", "Articole"),
    ("/recenzii", "reviews", "generic", "Recenzii"),
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


def already_seeded(session) -> bool:
    return session.scalar(__import__("sqlalchemy").select(Clinic.id).limit(1)) is not None


def seed(session, data: dict) -> dict:
    counts: dict[str, int] = {}

    # ── site state ─────────────────────────────────────────────────────────
    state = session.get(SiteState, 1) or SiteState(id=1)
    state.site_name = data["site"]["name"]
    session.merge(state)

    # ── clinics (+ contacts, hours) ──────────────────────────────────────────
    clinic_ids = []
    for pos, c in enumerate(data["clinics"]):
        clinic = Clinic(
            slug=_slug(c["name"]), name=c["name"], area=c.get("area"),
            address_full=c.get("address"), map_link_url=c.get("mapsLink"),
            map_embed_url=c.get("embedUrl"), status="active", position=pos,
        )
        session.add(clinic)
        session.flush()
        clinic_ids.append(clinic.id)
        session.add(ClinicContact(
            clinic_id=clinic.id, kind="phone", display_value=c["phoneDisplay"],
            normalized_value=re.sub(r"[^\d+]", "", c["phone"]), is_primary=True, position=0,
        ))
        for h in c.get("schedule", []):
            session.add(ClinicHours(
                clinic_id=clinic.id, weekday=WEEKDAY_ORDER.get(h["day"], 0) or 0,
                closed=not h.get("open", True),
            ))
    counts["clinics"] = len(clinic_ids)
    counts["phone_lines"] = len({c["phone"] for c in data["clinics"]})

    # ── links ────────────────────────────────────────────────────────────────
    for i, ph in enumerate(data.get("phones", [])):
        session.add(SiteLink(kind="phone", label=ph["label"], value=ph["tel"],
                             display_value=ph["display"], position=i))
    social = data.get("social", {})
    for k in ("facebook", "instagram", "linkedin", "website"):
        if social.get(k):
            session.add(SiteLink(kind="social", label=k, value=social[k]))
    if data["contact"].get("reviewsUrl"):
        session.add(SiteLink(kind="review", label="Google", value=data["contact"]["reviewsUrl"]))

    # ── services (6) as treatments ───────────────────────────────────────────
    for i, s in enumerate(data["services"]):
        session.add(Treatment(slug=f"service-{i}-{_slug(s['title'])}", name=s["title"],
                             summary=s.get("desc"), active=True, position=i))
    counts["services"] = len(data["services"])

    # ── categories (10) + prices (20) ────────────────────────────────────────
    price_rows = 0
    for pos, cat in enumerate(data["treatmentCategories"]):
        category = TreatmentCategory(slug=_slug(cat["id"]), label=cat["title"], position=pos)
        session.add(category)
        session.flush()
        for j, row in enumerate(cat["rows"]):
            t = Treatment(slug=f"cat-{cat['id']}-{j}", name=row["name"], category_id=category.id, position=j)
            session.add(t)
            session.flush()
            kind, amount, amount_max = _parse_price(row.get("price", ""))
            session.add(TreatmentPrice(
                treatment_id=t.id, price_kind=kind, amount=amount, amount_max=amount_max,
                currency="RON", note=row.get("price"), position=j,
            ))
            price_rows += 1
    counts["treatment_categories"] = len(data["treatmentCategories"])
    counts["treatment_price_rows"] = price_rows

    # ── offers (6) + features ────────────────────────────────────────────────
    for pos, o in enumerate(data["offers"]):
        kind, amount, _m = _parse_price(o.get("price", ""))
        offer = Offer(slug=_slug(o["name"]), name=o["name"], summary=o.get("desc"),
                      badge=o.get("badge"), price_amount=amount, currency="RON",
                      status="draft", featured=bool(o.get("featured")), position=pos)
        session.add(offer)
        session.flush()
        for fi, feat in enumerate(o.get("features", [])):
            session.add(OfferFeature(offer_id=offer.id, label=feat, position=fi))
    counts["offers"] = len(data["offers"])

    # ── partners (6) ─────────────────────────────────────────────────────────
    for pos, p in enumerate(data["partners"]):
        session.add(Partner(name=p["name"], relationship_type=p.get("type"), badge=p.get("badge"), position=pos))
    counts["partners"] = len(data["partners"])

    # ── doctors ──────────────────────────────────────────────────────────────
    for pos, d in enumerate(data.get("doctors", [])):
        session.add(Doctor(slug=_slug(d["name"] + f"-{pos}"), name=d["name"], role=d.get("role"),
                          focus=d.get("focus"), active=True, position=pos))

    # ── ebooks (6) ───────────────────────────────────────────────────────────
    for pos, e in enumerate(data["ebooks"]):
        session.add(Ebook(slug=_slug(e["label"]), title=e["title"], category=e.get("cat"),
                        description=e.get("desc"), active=True, position=pos))
    counts["ebooks"] = len(data["ebooks"])

    # ── news (3) ─────────────────────────────────────────────────────────────
    for pos, n in enumerate(data["newsItems"]):
        session.add(NewsItem(slug=f"news-{pos}-{_slug(n['title'])}", title=n["title"],
                          category=n.get("cat"), status="needs_review", position=pos))
    counts["news_items"] = len(data["newsItems"])

    # ── reviews (9) ──────────────────────────────────────────────────────────
    for pos, r in enumerate(data["reviews"]):
        session.add(Review(author=r.get("author", "Anonim"), review_date=utcnow().date(),
                        rating=int(r.get("rating", 5)), text_body=r.get("text"),
                        source="google", status="needs_review", position=pos))
    counts["reviews"] = len(data["reviews"])

    # ── articles (17) ────────────────────────────────────────────────────────
    for pos, a in enumerate(data["articles"]):
        session.add(Article(slug=f"art-{pos}-{_slug(a['title'])}", title=a["title"],
                          category=a.get("cat"), excerpt=a.get("excerpt"),
                          body_markdown=a.get("body"), status="needs_review", position=pos))
    counts["articles"] = len(data["articles"])

    # ── case studies (3) ─────────────────────────────────────────────────────
    for pos, c in enumerate(data["beforeAfterCases"]):
        session.add(CaseStudy(title=c["title"], description=c.get("desc"),
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

    # ── legal (needs_review baseline) ────────────────────────────────────────
    for t in ("gdpr", "privacy", "terms"):
        session.add(LegalDocument(doc_type=t, version_label="migration-baseline",
                               body_markdown=f"{t} placeholder — needs review.", active=True))

    # ── pages (route inventory) ──────────────────────────────────────────────
    for path_, key, template, title in ROUTES:
        session.add(Page(path=path_, route_key=key, template_key=template, title=title,
                       enabled=True, indexable=not path_.startswith(("/gdpr", "/confid", "/termeni"))))

    session.flush()
    return counts


def create_migration_baseline(session) -> str:
    """Create the one auditable migration_baseline publication (empty DB only)."""
    from src.site.snapshot_builder import build_snapshot, content_hash

    snapshot = build_snapshot(session)
    chash = content_hash(snapshot)
    pub = SitePublication(
        id=uuid7(), version=1, workspace_version=1, schema_version=1,
        snapshot=snapshot.model_dump(mode="json"), content_hash=chash,
        activation_reason="migration_baseline", created_by="seed",
    )
    session.add(pub)
    session.flush()
    state = session.get(SiteState, 1)
    state.active_publication_id = pub.id
    session.flush()
    return str(pub.id)


def main() -> int:
    data = json.loads((SEEDS / "current-site.json").read_text())
    with session_scope() as session:
        if already_seeded(session):
            print("seed: already seeded — no changes")
            return 0
        counts = seed(session, data)
        pub_id = create_migration_baseline(session)
        print(f"seed: created baseline workspace + migration_baseline publication {pub_id}")
        print("seed: counts " + json.dumps(counts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
