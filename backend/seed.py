"""Canonical Compose seed entrypoint.

All public DentNow content is loaded from ``seeds/current-site.json`` into
PostgreSQL, while the temporary photo is processed and stored in MinIO.
"""
from scripts.seed_current_site import main


if __name__ == "__main__":
    raise SystemExit(main())
