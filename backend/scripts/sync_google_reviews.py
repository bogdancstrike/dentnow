import datetime
import logging
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import requests
from sqlalchemy import select

from src.config import Config
from src.core.db import session_scope
from src.clinics.models import Clinic
from src.editorial.models import Review

logger = logging.getLogger(__name__)

def sync_reviews_for_clinic(session, clinic: Clinic, api_key: str):
    if not clinic.google_place_id:
        return

    url = (
        "https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={clinic.google_place_id}"
        "&fields=reviews"
        f"&key={api_key}"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    if data.get("status") != "OK":
        logger.error(f"Failed to fetch reviews for {clinic.name}: {data.get('status')}")
        return

    reviews_data = data.get("result", {}).get("reviews", [])
    if not reviews_data:
        return

    # Get existing reviews for this clinic
    existing_reviews = session.scalars(
        select(Review).where(Review.clinic_id == clinic.id, Review.source == "google")
    ).all()
    existing_authors_and_dates = {(r.author, r.review_date) for r in existing_reviews}

    added = 0
    for r in reviews_data:
        rating = r.get("rating", 0)
        # Requirement: "pulls the latest 5-star reviews"
        if rating < 5:
            continue

        author = r.get("author_name")
        review_time = datetime.datetime.fromtimestamp(r.get("time")).date()
        text_body = r.get("text")
        source_url = r.get("author_url")

        if (author, review_time) in existing_authors_and_dates:
            continue

        new_review = Review(
            workspace_id=clinic.workspace_id,
            source="google",
            source_url=source_url,
            author=author,
            review_date=review_time,
            rating=rating,
            text_body=text_body,
            clinic_id=clinic.id,
            status="published",
            verified_at=datetime.datetime.now(datetime.timezone.utc),
        )
        session.add(new_review)
        added += 1

    session.commit()
    logger.info(f"Synced {added} new reviews for clinic {clinic.name}")


def main():
    logging.basicConfig(level=logging.INFO)
    api_key = Config.GOOGLE_PLACES_API_KEY
    if not api_key:
        logger.warning("GOOGLE_PLACES_API_KEY is not set. Skipping sync.")
        return

    with session_scope() as session:
        clinics = session.scalars(
            select(Clinic).where(Clinic.status != "closed")
        ).all()
        for clinic in clinics:
            sync_reviews_for_clinic(session, clinic, api_key)
        
        # Rebuild site snapshot to include new reviews
        from src.site.snapshot_builder import build_snapshot, canonical_json
        from src.site.models import SitePublication
        from src.core.clock import utcnow
        
        snap = build_snapshot(session)
        pub = SitePublication(snapshot_json=canonical_json(snap), is_active=True, created_at=utcnow(), created_by="system")
        for old in session.scalars(select(SitePublication).where(SitePublication.is_active == True)).all():
            old.is_active = False
        session.add(pub)
        session.commit()
        logger.info("Published new site snapshot with updated reviews.")


if __name__ == "__main__":
    main()
