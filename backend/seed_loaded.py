"""Deterministic high-volume seed for production-like UI and query testing.

Run through ``make seed loaded``. The audited current-site seed is always applied
first; this file then adds clearly labelled synthetic records. It is idempotent and
does not create patient records or pretend demo content is clinic-approved advice.
"""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select

import src.models_all  # noqa: F401
from scripts.seed_current_site import (
    create_seed_publication,
    main as seed_default,
    seed_placeholder_media,
)
from src.catalog.models import Offer, OfferFeature, Treatment, TreatmentCategory, TreatmentPrice
from src.clinics.models import Clinic, Doctor, DoctorClinic
from src.core.db import session_scope
from src.editorial.models import Article
from src.media.models import MediaAsset
from src.site.workspace import bump_workspace_version

LOADED_MARKER_SLUG = "demo-clinica-01"


def already_loaded(session) -> bool:
    return session.scalar(select(Clinic.id).where(Clinic.slug == LOADED_MARKER_SLUG).limit(1)) is not None


def seed_loaded(session, placeholder_media_id: uuid.UUID) -> dict[str, int]:
    clinics: list[Clinic] = []
    for index in range(1, 25):
        sector = ((index - 1) % 6) + 1
        clinic = Clinic(
            slug=f"demo-clinica-{index:02d}",
            name=f"DentNow Demo {index:02d}",
            area=f"București · Sector {sector}",
            address_full=f"Adresă sintetică pentru testare nr. {index}, Sector {sector}, București",
            status="active",
            position=100 + index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        )
        session.add(clinic)
        clinics.append(clinic)
    session.flush()

    for index in range(1, 73):
        doctor = Doctor(
            slug=f"medic-demo-{index:03d}",
            name=f"Dr. Demo {index:03d}",
            role=("Stomatologie generală", "Ortodonție", "Implantologie", "Profilaxie")[index % 4],
            focus="Profil demonstrativ pentru testarea listelor și filtrelor administrative.",
            portrait_media_id=placeholder_media_id,
            active=True,
            position=100 + index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        )
        session.add(doctor)
        session.flush()
        clinic = clinics[(index - 1) % len(clinics)]
        session.add(DoctorClinic(doctor_id=doctor.id, clinic_id=clinic.id))

    categories: list[TreatmentCategory] = []
    for index, label in enumerate(("Diagnostic demo", "Prevenție demo", "Restaurare demo", "Ortodonție demo", "Chirurgie demo"), 1):
        category = TreatmentCategory(
            slug=f"categorie-demo-{index}", label=label,
            description="Categorie sintetică pentru testare încărcată.", position=100 + index,
            created_by="seed-loaded", updated_by="seed-loaded",
        )
        session.add(category)
        categories.append(category)
    session.flush()

    for index in range(1, 121):
        treatment = Treatment(
            slug=f"tratament-demo-{index:03d}",
            name=f"Tratament demonstrativ {index:03d}",
            category_id=categories[(index - 1) % len(categories)].id,
            summary="Înregistrare sintetică pentru verificarea catalogului; nu reprezintă recomandare medicală.",
            active=True,
            position=100 + index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        )
        session.add(treatment)
        session.flush()
        session.add(TreatmentPrice(
            treatment_id=treatment.id,
            price_kind="exact",
            amount=100 + index * 10,
            old_amount=150 + index * 10 if index % 4 == 0 else None,
            currency="RON",
            note="Valoare sintetică pentru testare",
            position=index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        ))

    for index in range(1, 49):
        offer = Offer(
            slug=f"oferta-demo-{index:03d}",
            name=f"Ofertă demonstrativă {index:03d}",
            summary="Conținut sintetic folosit exclusiv pentru testarea interfeței încărcate.",
            badge="Demo",
            price_amount=300 + index * 25,
            old_amount=450 + index * 25,
            currency="RON",
            status="active",
            featured=index % 7 == 0,
            position=100 + index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        )
        session.add(offer)
        session.flush()
        for feature_index in range(1, 5):
            session.add(OfferFeature(
                offer_id=offer.id,
                label=f"Beneficiu demonstrativ {feature_index}",
                position=feature_index,
                created_by="seed-loaded",
                updated_by="seed-loaded",
            ))

    for index in range(1, 241):
        session.add(Article(
            slug=f"articol-demo-{index:03d}",
            title=f"Ghid demonstrativ DentNow {index:03d}",
            category=("Prevenție", "Igienă orală", "Tehnologie", "Întrebări frecvente")[index % 4],
            excerpt="Articol sintetic pentru testarea căutării, paginării și statisticilor editoriale.",
            body_markdown=(
                "## Conținut demonstrativ\n\n"
                "Acest text există exclusiv pentru testarea unui mediu încărcat și nu este recomandare medicală.\n\n"
                "- verificare listă\n- verificare căutare\n- verificare previzualizare"
            ),
            cover_media_id=placeholder_media_id,
            author="Seed Loaded",
            published_at=date.today(),
            status="published",
            position=100 + index,
            created_by="seed-loaded",
            updated_by="seed-loaded",
        ))

    bump_workspace_version(session)
    return {"clinics": 24, "doctors": 72, "treatments": 120, "offers": 48, "articles": 240}


def main() -> int:
    seed_default()
    with session_scope() as session:
        if already_loaded(session):
            print("seed-loaded: already loaded — no changes")
            return 0
        placeholder = session.scalar(
            select(MediaAsset.id).where(MediaAsset.deleted_at.is_(None)).order_by(MediaAsset.created_at).limit(1)
        )
        if placeholder is None:
            placeholder = seed_placeholder_media(session)
        counts = seed_loaded(session, placeholder)
        publication_id = create_seed_publication(session, "loaded_seed")
        print(f"seed-loaded: activated production-like dataset {publication_id}")
        print(f"seed-loaded: counts {counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

