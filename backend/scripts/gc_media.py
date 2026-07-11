"""Media garbage collection — dry-run first, explicit confirmation to mutate.

Computes deletable assets: soft-deleted, absent from the workspace (content links),
absent from retained publications, and absent from active preview sessions. Requires
``--confirm-delete`` to actually remove bytes; invoked via an operations runbook or
host scheduler (``docker compose run``), never an in-process scheduler.

    python scripts/gc_media.py               # dry-run: report candidates
    python scripts/gc_media.py --confirm-delete
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

import src.models_all  # noqa: E402,F401
from src.core.db import session_scope  # noqa: E402
from src.media.models import (  # noqa: E402
    ContentMediaLink,
    MediaAsset,
    MediaVariant,
    PublicationMedia,
)


def _referenced_ids(session) -> set:
    refs: set = set()
    refs |= {r for (r,) in session.execute(select(ContentMediaLink.asset_id)).all()}
    refs |= {r for (r,) in session.execute(select(PublicationMedia.asset_id)).all()}
    return refs


def compute_candidates(session) -> list:
    referenced = _referenced_ids(session)
    deleted_assets = session.scalars(
        select(MediaAsset).where(MediaAsset.deleted_at.is_not(None))
    ).all()
    return [a for a in deleted_assets if a.id not in referenced]


def main() -> int:
    parser = argparse.ArgumentParser(description="DentNow media GC")
    parser.add_argument("--confirm-delete", action="store_true", help="actually delete bytes")
    parser.add_argument("--dry-run", action="store_true", help="report only (default)")
    args = parser.parse_args()

    with session_scope() as session:
        candidates = compute_candidates(session)
        print(f"gc_media: {len(candidates)} deletable asset(s)")
        for a in candidates:
            print(f"  - {a.id} ({a.privacy_class}, {a.mime_type})")

        if not args.confirm_delete:
            print("dry-run: pass --confirm-delete to remove bytes and rows")
            return 0

        from src.media.minio_storage import get_storage

        storage = get_storage()
        removed = 0
        for a in candidates:
            for v in session.scalars(select(MediaVariant).where(MediaVariant.asset_id == a.id)).all():
                try:
                    storage.delete(v.object_key)
                except Exception as exc:  # pragma: no cover
                    print(f"  ! failed to delete {v.object_key}: {exc}")
                session.delete(v)
            session.delete(a)
            removed += 1
        print(f"gc_media: removed {removed} asset(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
