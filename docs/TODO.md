# DentNow Implementation — Progress Tracker

Tracks execution of `docs/implementation_plan.md` (24 tasks) against `docs/architecture.md`.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` DONE · `[!]` blocked/needs-input

**Scope note:** This is a full rewrite of a static React SPA into a Docker Compose monorepo
(qf/Flask backend, PostgreSQL 18, MinIO, Keycloak, TS/React admin, publishing/preview
pipeline, CI, backups). It is large; progress is committed task-by-task.

---

## CURRENT STATE (snapshot)

**Deployable now:** `./ops/init-secrets.sh && docker compose up --build -d` serves the whole
app on `:3000` — public site (seeded content, per-route API loading) + hidden `/login` →
Keycloak (`:8090`, `admin/admin` in realm `doncik`) → admin backoffice with CRUD + publish.
Backend **124 tests**, frontend **18 tests**, migrations 0001–0007 clean, live smoke green.

| Area | State |
|---|---|
| Backend (Tasks 3–13) + admin search (18) | ✅ complete + tested |
| Public site (14) | 🚧 API-gated shell + per-route endpoints; **pages still read seeded `src/data`** (matches, not yet pure-API) |
| Admin shell (15) | ✅ Keycloak login, `/admin/me` gating, one AntD ConfigProvider |
| Admin CRUD (16–17) | 🚧 13 screens via generic ResourceScreen; **missing: media, audit, nested quiz, FK dropdowns** |
| cmdk (18) | 🚧 backend search done; palette UI pending |
| Preview/publish (19) | 🚧 publish/validate/rollback UI + preview-token launch done; **isolated preview app pending** |
| Deploy (20) | 🚧 frontend nginx + per-route serving in Compose done; preview service + prod edge pending |
| Hardening/backup (21), tests (22), CI (23), docs (24) | ⬜ not started (agents hit session limit before starting) |

## NEW REQUIREMENTS (user, this session) — to implement
- [ ] **URL per admin tab** — React Router inside /admin so each section deep-links (`/admin/clinici`, `/admin/echipa-medicala`, …) instead of state-based tabs.
- [ ] **Dropdowns for existing refs** everywhere in /admin (existing clinic/category/treatment/page → searchable `RemoteSelect`, not free-text id). *(RemoteSelect component built; wiring into forms pending.)*
- [ ] **More CRUD**: nested quiz question/option/band editor; image-carousel/gallery media; offer→treatment selection; **live preview** of the real page.
- [ ] **Reviews from Google** — "Recenzii" is not manually authored; sync automatically from Google reviews per clinic's Maps location. Needs `clinics.google_place_id` + Google Places API key. *(Reverses architecture §23 non-goal "no Google review scraping" — user override.)*
- [ ] **Enterprise/professional look** + `cmdk` quick actions.

---

## Environment (verified 2026-07-11)
- [x] qf wheel present `backend/dist/qf-1.0.5-py3-none-any.whl` (sha256 `1863cd0d…` matches plan)
- [x] Docker 29.6.1, Python 3.12.3, Node 23.11.1, npm 11.13.0 available
- [x] `.env` at root confirmed to be **clinic content** (phone/email/address/social), no secrets
- [x] Repo still frontend-at-root; no `frontend/`, `backend/src`, or `docker-compose.yml` yet

---

## Task 1 — Move frontend into `frontend/` (commit: `chore: organize frontend as a monorepo component`) ✅ DONE
- [x] Step 1: Baseline — git status clean, fallback secret scan (no gitleaks) clean, npm ci ok, lint exit 0, vite build to scratchpad ok (101 modules)
- [x] Step 2: `git mv` src/public/scripts + config files into `frontend/`; `.env` → `frontend/content-source.env` (verified clinic content, no secrets)
- [x] Step 3: README commands → `npm --prefix frontend …`; docker-publish.yml `context: ./frontend`; scripts use cwd-relative paths (work as-is)
- [x] Step 4: Pure move verified — build hashes identical to baseline (`index-DsOQmZvi.css`, `index-DeAmoGHe.js`); lint/smoke pass
- [x] Step 5: Committed `7cb29f1` (on branch `feat/backend-admin-platform`)

## Task 2 — Typed frontend foundation + public runtime config ✅ DONE (commits `25016c5`, `fca4673`, `78d3463`)
- [x] Step 1: `tests/runtime-config.test.ts` — 9 tests (relative base, malformed JSON, non-2xx, weird strings, strict extra-key reject, wrong-realm reject, missing admin coords) — all pass
- [x] Step 2: installed antd6.5, tanstack-query, cmdk, dompurify(self-typed, dropped deprecated @types/dompurify), keycloak-js, zod4, vitest3+coverage, msw, playwright, typescript7, @types/node; scripts typecheck/test/test:coverage/e2e added
- [x] Step 3: `src/config/runtime.ts` (Zod strict, no content defaults, trailing-slash normalize, `requireAdminConfig` gate); tsconfig strict+allowJs+checkJs:false
- [x] Step 4: `playwright.config.ts` (mock/compose); `App.tsx` split entry (preview-origin / lazy admin / public); `PublicApp.tsx`, `admin/AdminApp.tsx` + `preview/PreviewApp.tsx` placeholders; `main.tsx` loads config before mount
- [x] Step 5: typecheck ✓, 9/9 tests ✓, lint ✓, build ✓ — AdminApp/PreviewApp are separate lazy chunks; keycloak-js **library** absent from eager chunk (only config field-name strings present); smoke ✓
- [x] Step 6: committed

> ⚠️ Note: an external auto-commit tool in this environment committed Task 2 files as
> `25016c5` + `fca4673` mid-work (messages differ from the plan's suggested subject but
> content matches the verified tree). Watch for it racing future task commits.

## Task 3 — Scaffold qf backend + prove contract ✅ DONE (commit `ecb8384` + others)
- [x] Step 1: wheel vendored + `backend/dist/SHA256SUMS` (verified); `.gitignore` scoped `dist/`→`frontend/dist/` so wheel is tracked
- [x] Step 2: `requirements.txt` (DentNow-scoped: flask-restx, gunicorn/gevent/psycogreen, sqlalchemy/psycopg2/alembic, pydantic, python-jose, boto3, Pillow, bleach, markdown-it-py, prometheus; +colorama/redis/kafka-python<3 for qf import chain) + `requirements-dev.txt`; contract tests written
- [x] Step 3: `wsgi.py` FrameworkApp(enable_etl=False, no scheduler/Kafka), gevent+psycogreen patch; `config.py` shim; `src/config.py` (added WORKER_NAME/ERROR_TOPIC/REDIS_*/SECRET_KEY that qf evaluates at import)
- [x] Step 4: `src/api/health.py` (health/liveness ok, readiness 503 until probes), `src/core/correlation.py`, `src/core/errors.py` (envelope), `maps/endpoint.json` namespace `api`
- [x] Step 5: venv built, qf wheel+deps installed; **10/10 contract tests pass**; routes `/api/health`, `/api/liveness`, `/api/readiness` registered
- [x] Step 6: committed

> pip hash-locking (pip-tools `--require-hashes`) deferred to Task 23 CI; floors used now for a working install.
> `.gitignore`: `frontend/dist/`, `backend/.venv/`, `__pycache__/`, caches ignored.

## Task 4 — Postgres/MinIO/Keycloak Compose infra ✅ DONE (commits incl. `8eea169`)
- [x] Step 1: `backend/tests/compose/test_infrastructure.sh` (5 checks)
- [x] Step 2: pinned services postgres:18 / minio RELEASE.2024-12-18 / mc RELEASE.2024-11-21 / keycloak:26.1; healthchecks; named volumes `postgres-data`,`minio-data`; loopback-only ports
- [x] Step 3: `backend/Dockerfile` (py3.12 multi-stage, non-root, wheel checksum verified); `migrate`/`seed`/`api` services build it
- [x] Step 4: `ops/init-secrets.sh` (7 secrets, 0600, refuses weak/no-clobber); Compose secrets + `*_FILE`; keycloak DB provisioned by root one-shot `postgres-init` (keeps 0600; postgres init.d runs as unprivileged user)
- [x] Step 5: `minio-init` → bucket versioned+private, policy `dentnow-media-rw`, app user scoped (idempotent)
- [x] Step 6: `keycloak-config` → realm `doncik`, `dentnow-admin-spa` (PKCE), `dentnow-api` (bearer-only), audience mapper, 4 roles (idempotent; leaves existing realm intact)
- [x] Step 7: **verified** — postgres18 data-dir fix (`/var/lib/postgresql`), non-conflicting host ports (5442/8090/5110; testing_platform holds 5432/8080/5100); single `docker compose up` brings up infra+init; smoke PASSED; re-run idempotent
- [x] Step 8: committed
- [x] **User req:** full app setup starts from `docker compose up` — `api` gated on full init chain; no manual `run` steps

> Note: `.env` + `.secrets/*` were auto-committed in `4909ed1`, untracked in `a213ffc`, now gitignored.
> Per user: dev uses **simple secrets** (`admin:admin`) — not a production exposure, no rotation needed.
> Production uses strong secrets (`ENVIRONMENT=production ./ops/init-secrets.sh`, enforced at startup).

## Task 5 — DB/transaction/error/migration foundations ✅ DONE (commit `6281858`)
- [x] Step 1: tests — `test_etags.py` (pure), `test_outbox.py` + `test_migrations.py` (DB-backed, rollback-isolated via conftest); 14 pass
- [x] Step 2: `core/db.py` (cached engine, pool_pre_ping, `session_scope`, `serializable_scope` REPEATABLE READ, `reset_engine_for_tests`); `clock.py` (utcnow, uuid7), `etag.py`, `pagination.py`, `mixins.py` (WorkspaceRoot)
- [x] Step 3: migration `0001_site_audit_outbox` — 13 tables (site_state singleton, links, nav menus/items, pages/sections/seo, publications immutable, preview_sessions, audit append-only, outbox/bindings/deliveries); partial-unique live indexes, indexed FKs, JSONB-object checks, pending-outbox index
- [x] Step 4: `models_all` imports site/audit/integrations; `alembic.ini` + `migrations/env.py` (reads Config.DATABASE_URL + Base.metadata) + script.py.mako
- [x] Step 5: `core/readiness.py` probe registry; `/api/readiness` runs postgres probe (generic 200/503, no detail leak)
- [x] Step 6: **verified** — `alembic upgrade head` OK, `alembic check` → no drift (fixed singleton PK auto-sequence); 14 + 10 tests pass. Container `migrate` path verified (image builds, connects, runs Alembic, exit 0) after secret-perms fix (`503a8d0`).
- [x] Step 7: committed

## Task 6 — Keycloak JWT verification + backend authz ✅ DONE (commit `c028098`)
- [x] Step 1: `test_token_verifier.py` (10), `test_authorization.py` (7), `test_admin_auth_boundary.py` (5) — in-test RSA/JWKS, capability matrix, route-map default-deny
- [x] Step 2: `token_verifier.py` — JWKS cache by kid (single refresh on unknown), internal fetch/public issuer, +azp +sub checks; Config coords from Task 3
- [x] Step 3: `capabilities.py` (matrix), `principal.py` (clinic scopes, admin implies all), `service.py` (claims→principal + injectable `ClinicScopeProvider` + admin_principals upsert), `decorators.py`; migration 0002 `admin_principals`
- [x] Step 4: `/api/v1/admin/me` (401 no token / 403 no role / 200 with roles+caps+scopes); `__dentnow_protected__` stamp for default-deny test
- [x] Step 5: CORS/headers already handle OPTIONS + `If-Match` + correlation echo (Task 3 `correlation.py`)
- [x] Step 6: **46 backend tests pass** (alembic-at-head test made head-dynamic)
- [x] Step 7: committed

## Task 7 — Site/nav/pages + clinic CRUD ✅ DONE (commit `a651155`)
- [x] Step 1: `test_site_service.py`, `test_clinic_service.py` (DB unit), `test_site_clinic_crud.py` (HTTP integration)
- [x] Step 2: migration 0003 (clinics + contacts/hours/transit/faqs, doctors, doctor_clinics, admin_principal_clinics); DB-backed `ClinicScopeProvider` wired in wsgi
- [x] Step 3: reusable `core/crud.py` CrudService (ETag/If-Match→409, soft-delete, audit, outbox, workspace bump, clinic scoping); `audit.write_audit`, `outbox.enqueue_event`, `workspace.bump_workspace_version`; site + clinic services + serializers + Pydantic schemas
- [x] Step 4: 59 default-deny `/api/v1/admin/*` endpoints (site/links/menus/nav-items/pages/sections/seo/clinics/contacts/hours/transit/faqs/doctors/doctor-clinics/admin-principals) generated into `maps/endpoint.json`
- [x] Step 5: **65 backend tests pass** — HTTP CRUD w/ ETag, stale-409, missing-If-Match 400, cross-clinic 404, editor-403, audit+outbox; qf passes Flask Response(+ETag) through
- [x] Step 6: committed

## Task 8 — Treatments/prices/offers/tech/partners CRUD ✅ DONE (commit `2e5f7bb`)
- [x] Step 1: `test_catalog_service.py` (schema+DB-check+scope), `test_catalog_crud.py` (HTTP)
- [x] Step 2: migration 0004 (11 catalog tables) with DB checks (non-negative/ordered amounts, currency `^[A-Z]{3}$`, ends_at>starts_at)
- [x] Step 3: catalog services (global = `manager_writable=False`; prices clinic-scoped); Pydantic price-kind + offer-date rules; 40 endpoints + mapping routes (clinic-treatments/offer-clinics/offer-treatments)
- [x] Step 4: **76 backend tests pass**; DB checks reject invalid prices/date windows independent of API; fixed empty-migration trap (models_all guard) + non-serializable Pydantic ctx (500→400)
- [x] Step 5: committed

## Task 9 — Editorial/legal/review/case/ebook/quiz CRUD ✅ DONE (commit `49df757`)
- [x] Step 1: `test_rich_text.py`, `test_editorial_service.py`, `test_editorial_crud.py`
- [x] Step 2: `editorial/rich_text.py` — markdown-it (html off) + Bleach allowlist; `sanitize_html` re-run at publish; `*_html` serialized
- [x] Step 3: migration 0005 (articles, news, reviews, case_studies, ebooks, legal_documents, quizzes/questions/options/result_bands)
- [x] Step 4: editorial services (slug unique, band-overlap, clinic-scoped reviews/cases); legal-approve + case-consent require CAP_ATTESTATION_APPROVE; redacted `/audit-events` (CAP_AUDIT_READ)
- [x] Step 5: **91 backend tests pass** — sanitized body_html (no script), approval gating (editor 403), band overlap, audit publisher-only
- [x] Step 6: committed

## Task 10 — Private MinIO media + consent gates ✅ DONE (commit `a58a452`)
- [x] Step 1: `test_image_processor.py`, `test_media_service.py` (fake storage), `test_media_gc.py`, `test_minio_media.py` (real, opt-in `RUN_MINIO_TESTS=1`)
- [x] Step 2: `ports.py` (ObjectStoragePort/ImageProcessorPort); `minio_storage.py` (boto3, path-style, timeouts); `image_processor.py` (Pillow)
- [x] Step 3: migration 0006 (6 media tables) + 11 **named** media FKs (round-trips); models_all wired
- [x] Step 4: streaming upload — EXIF-strip re-encode, size/pixel/bomb limits, format allowlist, original+thumbnail/card/hero variants, SHA-256 dedup per privacy class, alt-text required, failure cleanup
- [x] Step 5: delivery rules — public immutable cache; consent-bound `case_image` checks block+attestation → `410` after revoke/expiry, `no-store`; `media_public` gated on active publication (Task 11)
- [x] Step 6: mandatory MinIO readiness probe registered; `scripts/gc_media.py` dry-run-first + `--confirm-delete`
- [x] Step 7: **verified** — 103 tests pass + real-MinIO upload/read round trip; app credential bucket-scoped
- [x] Step 8: committed

## Task 11 — Preview/publication/rollback/public APIs ✅ DONE (commit `584b7e2`)
- [x] Step 1: `test_snapshot_builder.py`, `test_publication_flow.py`, `test_public_api.py`
- [x] Step 2: `snapshot_contract.SiteSnapshotV1` (Pydantic extra=forbid); `snapshot_builder` deterministic + `canonical_json`/`content_hash`
- [x] Step 3: `publication_validator` (missing legal/media/route); `publication_service.publish` advisory-lock atomic + unchanged→changed:false; audit + outbox
- [x] Step 4: `preview_service` one-use token→HttpOnly cookie; `activate` rollback (revalidates blocks, idempotent); `restore_workspace` guardrails; migration 0007
- [x] Step 5: public API bootstrap/page-by-path/articles/sitemap (active-publication only, ETag/304); `media_public` gated on publication reference
- [x] Step 6: **115 backend tests pass** — deterministic hash, publish/rollback, one-use preview exchange, anonymous reads + 304; `public_endpoint` decorator fixes flask-restx 500→envelope
- [x] Step 7: committed

## Task 12 — Integration boundary, no patient data ✅ DONE (commit `d274115`)
- [x] Step 1–4: `events.py` (versioned envelope + catalog), `ports.py` (outbound/inbound ACL), `serializers.py`, `docs/integration-contracts.md` (+ patient-engagement hard gate)
- [x] Step 5: **5 tests pass** — event `.v1` enforcement, transactional outbox insert, dependency rule (no vendor SDK/adapter in domain code), no patient/registration endpoint
- [x] Step 6: committed

## Task 13 — Export + seed current content ✅ DONE (commit `47ec24e`)
- [x] Step 1: parity manifest + `test_seed_parity.py`/`test_seed_idempotency.py` (opt-in RUN_SEED_TESTS)
- [x] Step 2: `export-current-content.mjs` (esbuild-defines import.meta.env from content-source.env; imports data modules) → `current-site.json` + 20 assets w/ SHA-256
- [x] Step 3: page-local + config mapping (clinics/phones/schedule/social/routes)
- [x] Step 4: idempotent `seed_current_site.py` (needs_review marks; migration_baseline publication on empty DB) + `verify_seed_parity.py`
- [x] Step 5: **verified** — seed→parity OK (all 14 counts match), double-seed no-op, 5 seed tests + 120 general pass
- [x] Step 6: committed; `content-source.env` deleted (values captured; config.js fallbacks identical)

> Note: MinIO asset upload in the seed is stubbed (assets copied to `backend/seeds/assets`, committed); wiring the MinIO push + media rows into the seed is a small follow-up (Task 20 stack run exercises it).

## Task 14 — Refactor public site to render backend data only 🚧 FOUNDATION DONE (commit `226a917`)
- [x] Step 1: `site-data-provider.test.tsx` (MSW loading/success/error, no leaked content)
- [x] Step 2: typed `publicClient` + `publicContracts` (Zod, mirrors SiteSnapshotV1) + query keys
- [ ] Step 3: convert every route to a pure renderer consuming `SiteDataProvider`/`fetchPageByPath`
- [ ] Step 4: replace unsafe/duplicated behavior (DOMPurify, derived prices/dates/JSON-LD)
- [ ] Step 5: remove retired `src/data` + `config.js` business fallbacks after parity
- [ ] Step 6: verify all public routes anonymously (mock Playwright)
- [x] Partial: `SiteDataProvider` (explicit loading/error, no compiled fallback) built + verified; typecheck/11 tests/lint/build pass
- [ ] Step 7: Commit (final)

## Task 15 — Keycloak-authenticated admin shell ✅ DONE (commit `0e79ba2`)
- [x] Step 1: `admin-client.test.ts` (bearer/correlation/ETag, If-Match, 409/401/500 mapping)
- [x] Step 2: `auth/keycloak.ts` lazy init (PKCE S256, login-required, in-memory, refresh)
- [x] Step 3: `api/adminClient.ts` (bearer + If-Match + correlation; typed VersionConflict/Unauthorized)
- [x] Step 4: `AdminApp.tsx` one AntD ConfigProvider + App; `theme.ts`
- [x] Step 5: loads `/admin/me` → shell or AccessDenied; permission-aware `AdminLayout` nav; `OverviewPage`
- [ ] Step 6: disposable E2E identity fixture (`seed_e2e_identities.py`) — deferred to Task 22
- [x] Step 7: **15 frontend tests pass**; antd+keycloak-js in lazy admin chunk only; typecheck/lint/build clean
- [x] Step 8: committed

## Task 16 — Admin CRUD foundations + site/clinic/catalog screens 🚧 SLICE DONE (commit `e1a7ef6`)
- [x] Reusable `ResourceTable` (server paging, rowKey=id, error state); `ClinicsScreen` full CRUD (Drawer form, If-Match edits, 409→explicit conflict message); QueryClientProvider wired; jsdom antd polyfills; 16 tests pass
- [ ] Remaining: site settings/links/menus/pages/SEO, catalog (treatments/prices/offers/partners), doctors screens — each follows the ClinicsScreen pattern

## Task 17 — Editorial/legal/quiz/media/audit admin (`feat(admin): manage editorial legal quiz media and audit`)
- [ ] Steps 1–7 (editorial/legal/quiz/media/audit features + MediaPicker/Upload/Consent/AuditDiff)

## Task 17 — Editorial/legal/quiz/media/audit admin 🚧 PARTIAL
- [x] editorial/legal/quiz screens via generic ResourceScreen (articles, reviews, legal, quiz, pages, navigation)
- [ ] Media library (upload grid, consent controls), audit explorer, NESTED quiz editor (questions/options/bands), before/after case pairing

## Task 18 — `cmdk` rapid navigation + quick actions 🚧 BACKEND DONE
- [x] backend `/api/v1/admin/search` (permission-scoped, min-2-char, clinic-scoped, 4 tests) — commit `+search`
- [ ] `CommandPalette.tsx` (Ctrl/Cmd+K, groups, remote search, quick actions) + mount in AdminLayout

## Task 19 — Preview/validate/publish/rollback UX 🚧 PARTIAL
- [x] `PublicationControls` (validate → errors, publish w/ confirm, history + rollback, preview-token launch)
- [ ] Isolated preview ORIGIN app (`src/preview/main.tsx` + fragment exchange + sandboxed iframe render)

## Task 20 — Production images + one-command Compose 🚧 PARTIAL
- [x] backend image (Task 4); frontend nginx image (Dockerfile + config.json entrypoint + /api proxy); `frontend` compose service; per-route public serving. `docker compose up --build` serves whole app on :3000
- [ ] `preview` compose service (isolated origin), production `edge` (Caddy TLS) profile

## Task 21 — SEO/security/observability/recovery ⬜ NOT STARTED
- [ ] CSP/security headers, redaction, prometheus metrics, safe JSON-LD; backup/restore/verify + minio_versions

## Task 22 — Cross-stack test matrix 🚧 STARTED
- [x] tester agent drives the LIVE app via Playwright (public render, requests, /login, admin) — reports bugs
- [ ] full backend+frontend coverage floor, seeded E2E identities, Makefile `check` target

## Task 23 — GitHub CI paired pipelines ⬜ NOT STARTED
- [ ] `ci.yml` (frontend+backend checks + Compose integration), paired image publish, secret scans

## Task 24 — Ops docs + release rehearsal ⬜ NOT STARTED
- [ ] README rewrite, deployment/recovery/content runbooks, clean release rehearsal

---

## Blocked / needs clinic input (does not block platform build; blocks content/prod durability)
- [!] Legal operator identity, DPO, retention, GDPR/cookie wording
- [!] Which Keycloak users get which roles/clinic scopes
- [!] Verified clinic hours/prices/offers/CAS/credentials/review metadata
- [!] Lawful basis/DPIA for before/after patient imagery
- [!] Off-host backup destination, RPO/RTO
