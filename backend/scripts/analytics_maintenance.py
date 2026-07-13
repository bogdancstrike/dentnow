#!/usr/bin/env python3
"""Roll up yesterday's analytics and enforce configured retention.

Run daily from the deployment scheduler:
  python scripts/analytics_maintenance.py
"""

from __future__ import annotations

import argparse
from datetime import date, timedelta

from src.analytics.service import prune_retention, rollup_day
from src.core.db import session_scope


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--day", type=date.fromisoformat, default=date.today() - timedelta(days=1)
    )
    parser.add_argument("--skip-rollup", action="store_true")
    parser.add_argument("--skip-prune", action="store_true")
    args = parser.parse_args()
    result: dict[str, object] = {"day": args.day.isoformat()}
    with session_scope() as session:
        if not args.skip_rollup:
            result["metrics_upserted"] = rollup_day(session, args.day)
        if not args.skip_prune:
            result.update(prune_retention(session))
    print(result)


if __name__ == "__main__":
    main()
