# Task 25: First-party visitor analytics implementation plan

> **Implementation mode:** execute this plan in the current session, with backend and frontend verification before commit.

**Goal:** Provide DentNow with consent-aware first-party traffic analytics and a permission-protected admin dashboard for daily/weekly/monthly/custom reporting, content popularity, device/browser/referrer/geographic statistics, and CSV export.

**Architecture:** Keep analytics in a dedicated backend context and dedicated PostgreSQL tables. The browser emits a small allow-listed event contract; the backend derives identity, network, device, browser, and location data from the request, enforces origin/consent/DNT/bot/rate-limit rules, and stores raw events under a finite retention policy. Admin endpoints aggregate events on demand and a maintenance service persists daily rollups for longer retention. Collection is disabled by default until production legal/privacy settings are approved.

**Technology:** Flask/qf, SQLAlchemy 2, PostgreSQL, Pydantic, React 19, TypeScript, Ant Design 6, Recharts-free accessible SVG/CSS charts, Vitest/Testing Library, pytest.

---

## 1. Backend storage and privacy boundary

**Files:**
- Create: `backend/src/analytics/__init__.py`
- Create: `backend/src/analytics/models.py`
- Create: `backend/src/analytics/schemas.py`
- Create: `backend/src/analytics/privacy.py`
- Create: `backend/src/analytics/service.py`
- Create: `backend/migrations/versions/0015_visitor_analytics.py`
- Modify: `backend/src/config.py`
- Modify: `backend/src/models_all.py`
- Modify: `backend/.env.example`

1. Add `analytics_events` with a bigint identity key, timestamp, HMAC visitor/session IDs, PostgreSQL `inet` client address, bounded user agent, allow-listed event/path/target fields, bounded referrer host, derived device/browser/OS families, and server-derived country/region/city/latitude/longitude.
2. Add `analytics_daily_metrics` with a composite day/metric/dimension key and bigint value; index dates and common event/content dimensions. Keep both tables independent of content, audit, and patient contexts.
3. Add settings for enabled/consent, HMAC key/version and rotation, trusted proxies, geo headers/precision, raw and aggregate retention, and per-visitor rate limit. Production collection remains off by default.
4. Implement exact-origin checks, trusted-proxy IP extraction, bounded UA classification, bot detection, HMAC pseudonyms, DNT/GPC suppression, validation and redaction. IP and UA identity claims remain server-derived; browser latitude/longitude are accepted only after browser permission and strict range/accuracy validation.
5. Implement event ingestion, rate limiting, summary queries, CSV output, daily rollup, retention pruning, and identifier rotation/deletion primitives.

## 2. Public and admin APIs

**Files:**
- Create: `backend/src/api/analytics_public.py`
- Create: `backend/src/api/analytics_admin.py`
- Create: `backend/scripts/analytics_maintenance.py`
- Modify: `backend/src/iam/capabilities.py`
- Modify: `backend/maps/endpoint.json`

1. Add `POST /api/v1/public/analytics/events`; return a neutral accepted/suppressed response without exposing derived identity or request data.
2. Add `analytics:read` to admins and publishers, then protect all analytics admin endpoints with it.
3. Add overview and CSV endpoints using an inclusive local-date range and bounded maximum interval. Return KPIs, time series, top pages/sections/articles/treatments/offers, CTAs, referrers, devices, browsers, operating systems, and geographic buckets/map points.
4. Add a maintenance CLI supporting rollup and retention deletion so operations can schedule it without introducing another runtime service.

## 3. Consent-aware public tracker

**Files:**
- Create: `frontend/src/analytics/analyticsClient.ts`
- Create: `frontend/src/analytics/AnalyticsObserver.tsx`
- Modify: `frontend/src/public-site/PublicApp.tsx`
- Modify: `frontend/src/config/runtime.ts`
- Modify: `frontend/docker-entrypoint.d/40-runtime-config.sh`
- Modify: `frontend/public/config.template.json`
- Modify: `.env.example`
- Modify: `docker-compose.yml`

1. Add runtime flags for collection and consent requirements; defaults keep collection disabled.
2. Emit route page views and typed article/treatment/offer/clinic views, delegated navigation/contact CTA clicks, meaningful section visibility, and engaged article reads.
3. Do not create analytics cookies or browser visitor IDs. Respect consent, DNT, GPC, visibility, same-origin delivery, and keepalive delivery. Send no IP or user-agent claims; request optional browser geolocation only after analytics consent and explicit browser permission.

## 4. Enterprise admin dashboard

**Files:**
- Create: `frontend/src/admin/features/analytics/analyticsContracts.ts`
- Create: `frontend/src/admin/features/analytics/AnalyticsScreen.tsx`
- Create: `frontend/src/admin/features/analytics/AnalyticsScreen.css`
- Modify: `frontend/src/admin/api/adminClient.ts`
- Modify: `frontend/src/admin/auth/permissions.ts`
- Modify: `frontend/src/admin/layout/adminNavigation.ts`
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`
- Modify: `frontend/src/admin/components/CommandPalette.tsx`

1. Add a responsive full-width analytics screen with 1/7/30/custom periods, Romanian date labels, refresh and CSV export.
2. Add visitor/session/page-view/CTA KPI cards and comparison deltas, an accessible SVG time-series chart plus readable data fallback, top-content tables, device/browser/OS bars, referrers, and a geographic map/grid.
3. Add explicit skeleton/loading, retryable error, and zero-data states.
4. Add permission-aware sidebar/cmdk navigation and safe 7-day/30-day/top-article quick views.

## 5. Tests and operational documentation

**Files:**
- Create: `backend/tests/unit/test_analytics_privacy.py`
- Create: `backend/tests/unit/test_analytics_service.py`
- Create: `backend/tests/contract/test_analytics_api.py`
- Create: `frontend/src/analytics/AnalyticsObserver.test.tsx`
- Create: `frontend/src/admin/features/analytics/AnalyticsScreen.test.tsx`
- Modify: `docs/TODO.md`

1. Test strict payload validation, server-only network/location derivation, HMAC rotation, bot/DNT/consent/origin/rate-limit decisions, date/timezone aggregation, retention, capability enforcement, and CSV shape.
2. Test tracker suppression/emission and dashboard range, accessibility, empty/error/content states.
3. Run focused backend and frontend tests, Alembic checks, TypeScript/build, Ant Design lint, and inspect the final diff for unrelated user changes.
4. Mark implemented Task 25 items complete while retaining a clearly worded production enablement/legal-policy blocker, including the approved change that IP, bounded user agent, and server-derived geo are stored under retention controls.
