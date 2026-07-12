"""Pure seed-transform regressions; does not require PostgreSQL or MinIO."""
from __future__ import annotations

import json
from pathlib import Path

from scripts.seed_current_site import _hours, _legacy_html_to_markdown, _weekdays


def test_legacy_article_html_becomes_markdown_not_visible_tags():
    result = _legacy_html_to_markdown(
        "<p>Text <strong>important</strong>.</p><p>• Primul<br>• Al doilea</p>"
    )
    assert result == "Text **important**.\n\n- Primul\n- Al doilea"
    assert "<p>" not in result


def test_weekday_range_and_hours_are_expanded():
    assert _weekdays("Luni – Vineri") == [0, 1, 2, 3, 4]
    opens, closes = _hours("09:00 – 19:00")
    assert opens.isoformat() == "09:00:00"
    assert closes.isoformat() == "19:00:00"


def test_cas_is_second_in_seeded_desktop_and_mobile_navigation():
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "current-site.json"
    navigation = json.loads(seed_path.read_text())["navigation"]
    for menu in ("desktop", "mobile"):
        assert navigation[menu][1] == {"label": "Decontare CAS", "to": "/decontat-cas"}
