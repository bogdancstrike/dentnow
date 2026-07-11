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

> ⚠️ **SECURITY:** auto-committer committed `.env` + all `.secrets/*` in `4909ed1`. Untracked in `a213ffc`;
> now gitignored. **Before any push:** rotate (`ops/init-secrets.sh --rotate`) + purge from history.
> Secrets are local dev-only, unpushed branch — contained.

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

## Task 7 — Site/nav/pages + clinic CRUD (`feat(cms): add site page and clinic management`)
- [ ] Step 1: failing domain/API tests
- [ ] Step 2: clinic/person schema, migration 0003, wire ClinicScopeProvider
- [ ] Step 3: services + serializers (audit, outbox, workspace_version++)
- [ ] Step 4: admin endpoints (site/links/menus/pages/sections/seo/clinics/doctors/scopes)
- [ ] Step 5: verify CRUD + concurrency (409, cross-clinic 403)
- [ ] Step 6: Commit

## Task 8 — Treatments/prices/offers/tech/partners CRUD (`feat(cms): add treatments prices offers and partners`)
- [ ] Step 1: failing catalog rule tests
- [ ] Step 2: catalog schema + checks, migration 0004
- [ ] Step 3: services + qf handlers (clinic-scoped vs global)
- [ ] Step 4: verify catalog + DB checks
- [ ] Step 5: Commit

## Task 9 — Editorial/legal/review/case/ebook/quiz CRUD (`feat(cms): add editorial legal and quiz management`)
- [ ] Step 1: failing sanitization + editorial tests
- [ ] Step 2: safe rich text (Markdown + Bleach allowlist)
- [ ] Step 3: editorial schema, migration 0005
- [ ] Step 4: CRUD handlers + redacted audit-events read
- [ ] Step 5: verify editorial APIs
- [ ] Step 6: Commit

## Task 10 — Private MinIO media + consent gates (`feat(media): manage private minio assets and consent`)
- [ ] Step 1: failing media/security tests
- [ ] Step 2: storage + image processor ports (boto3 MinIO adapter)
- [ ] Step 3: media schema, migration 0006, media FKs on editorial/etc
- [ ] Step 4: streaming upload + variants
- [ ] Step 5: media delivery rules (public/preview/consent-bound 410)
- [ ] Step 6: readiness MinIO probe + `gc_media.py`
- [ ] Step 7: verify against real MinIO
- [ ] Step 8: Commit

## Task 11 — Preview/publication/rollback/public APIs (`feat(publishing): add previews immutable releases and public api`)
- [ ] Step 1: failing snapshot/publication tests
- [ ] Step 2: `SiteSnapshotV1` (discriminated unions, typed JSON-LD)
- [ ] Step 3: validation + atomic publish (advisory lock, repeatable-read, outbox)
- [ ] Step 4: previews + rollback + restore-workspace, migration 0007
- [ ] Step 5: public read surface (bootstrap/page-by-path/articles/media/sitemap)
- [ ] Step 6: verify publication contracts
- [ ] Step 7: Commit

## Task 12 — Integration boundary, no patient data (`feat(integrations): add versioned outbox extension boundary`)
- [ ] Step 1: failing event/dependency tests
- [ ] Step 2: event envelope + current events
- [ ] Step 3: outbound/inbound ports docs
- [ ] Step 4: patient-engagement guardrail doc
- [ ] Step 5: verify boundaries
- [ ] Step 6: Commit

## Task 13 — Export + seed current content (`feat(migration): seed current dentnow content and media`)
- [ ] Step 1: parity manifest + failing tests
- [ ] Step 2: deterministic JS data exporter + asset copy w/ checksums
- [ ] Step 3: explicit mappings for page-local content
- [ ] Step 4: idempotent DB+MinIO seed (+ migration_baseline publication)
- [ ] Step 5: verify migration (double-seed idempotent, parity)
- [ ] Step 6: Commit (delete `content-source.env`)

## Task 14 — Refactor public site to render backend data only (`feat(frontend): render public site from published api data`)
- [ ] Step 1: failing provider + no-fallback tests
- [ ] Step 2: typed public API clients + query keys
- [ ] Step 3: convert every route to pure renderer
- [ ] Step 4: replace unsafe/duplicated behavior (DOMPurify, derived prices/dates/JSON-LD)
- [ ] Step 5: remove retired data after parity
- [ ] Step 6: verify all public routes anonymously
- [ ] Step 7: Commit

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
