# DentNow Implementation — Progress Tracker

Tracks execution of `docs/implementation_plan.md` (24 tasks) against `docs/architecture.md`.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` DONE · `[!]` blocked/needs-input

**Scope note:** This is a full rewrite of a static React SPA into a Docker Compose monorepo
(qf/Flask backend, PostgreSQL 18, MinIO, Keycloak, TS/React admin, publishing/preview
pipeline, CI, backups). It is large; progress is committed task-by-task.

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

## Task 15 — Keycloak-authenticated admin shell (`feat(admin): add keycloak protected administration shell`)
- [ ] Step 1: failing route/auth/client tests
- [ ] Step 2: lazy Keycloak init (PKCE S256, in-memory tokens)
- [ ] Step 3: admin API client (refresh, bearer, If-Match, 409 typed)
- [ ] Step 4: shell with one AntD ConfigProvider
- [ ] Step 5: load `/admin/me` before protected nav
- [ ] Step 6: disposable E2E identity fixture (`seed_e2e_identities.py`)
- [ ] Step 7: verify auth behavior
- [ ] Step 8: Commit

## Task 16 — Admin CRUD foundations + site/clinic/catalog screens (`feat(admin): manage site clinics catalog and offers`)
- [ ] Steps 1–7 (ResourceTable/Drawer, site/clinic/catalog/offers features)

## Task 17 — Editorial/legal/quiz/media/audit admin (`feat(admin): manage editorial legal quiz media and audit`)
- [ ] Steps 1–7 (editorial/legal/quiz/media/audit features + MediaPicker/Upload/Consent/AuditDiff)

## Task 18 — `cmdk` rapid navigation + quick actions (`feat(admin): add cmdk navigation and quick actions`)
- [ ] Steps 1–6 (backend `/admin/search` + CommandPalette + registry)

## Task 19 — Preview/validate/publish/rollback UX (`feat(admin): preview publish and roll back site releases`)
- [ ] Steps 1–5 (PreviewApp, isolated origin, PublicationBar/ValidationReport/History)

## Task 20 — Production images + one-command Compose (`feat(deploy): deliver complete docker compose stack`)
- [ ] Steps 1–7 (backend+frontend images, nginx templates, preview origin, edge, secret boundaries)

## Task 21 — SEO/security/observability/recovery (`feat(platform): harden observe and back up dentnow`)
- [ ] Steps 1–7 (sitemap/JSON-LD, CSP/headers, metrics/logs, backup/restore/verify)

## Task 22 — Cross-stack test matrix (`test: cover public admin media and publication flows`)
- [ ] Steps 1–6 (backend+frontend coverage, real-service Playwright, Makefile targets)

## Task 23 — GitHub CI paired pipelines (`ci: test and publish paired dentnow images`)
- [ ] Steps 1–5 (ci.yml PR checks, paired image publish, safety scans)

## Task 24 — Ops docs + release rehearsal (`docs: add dentnow operations and deployment runbooks`)
- [ ] Steps 1–6 (README, content/deploy/recovery/integration runbooks, rehearsal)

---

## Blocked / needs clinic input (does not block platform build; blocks content/prod durability)
- [!] Legal operator identity, DPO, retention, GDPR/cookie wording
- [!] Which Keycloak users get which roles/clinic scopes
- [!] Verified clinic hours/prices/offers/CAS/credentials/review metadata
- [!] Lawful basis/DPIA for before/after patient imagery
- [!] Off-host backup destination, RPO/RTO
