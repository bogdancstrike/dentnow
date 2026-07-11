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

## Task 2 — Typed frontend foundation + public runtime config (`feat(frontend): add typed runtime and split app entry`)
- [ ] Step 1: runtime-config tests (relative API base, malformed JSON, missing admin coord)
- [ ] Step 2: install app+test deps (antd6, tanstack-query, cmdk, keycloak-js, zod, vitest, msw, playwright, ts)
- [ ] Step 3: runtime config loader (Zod, no content defaults), tsconfig strict+allowJs
- [ ] Step 4: Playwright harness (mock/compose projects), App.tsx split entry (public/admin/preview)
- [ ] Step 5: verify typecheck/test/lint/build; keycloak-js not in eager chunk
- [ ] Step 6: Commit

## Task 3 — Scaffold qf backend + prove contract (`feat(backend): scaffold qf api runtime`)
- [x] Step 1: vendor wheel + checksum  *(wheel present; SHA256SUMS file still to add)*
- [ ] Step 1b: write `backend/dist/SHA256SUMS`
- [ ] Step 2: requirements.txt/-dev.txt + failing qf contract tests
- [ ] Step 3: `wsgi.py` qf assembly (enable_etl=False), gevent/psycogreen patch
- [ ] Step 4: health handlers + strict endpoint map (namespace `api`)
- [ ] Step 5: verify qf startup + 3 health routes
- [ ] Step 6: Commit

## Task 4 — Postgres/MinIO/Keycloak Compose infra (`feat(compose): provision postgres minio and keycloak`)
- [ ] Step 1: infra smoke script
- [ ] Step 2: pinned persistent services + healthchecks + named volumes
- [ ] Step 3: reusable backend image + migrate/seed/api utility services
- [ ] Step 4: isolated DBs/identities/secret files (`ops/init-secrets.sh`)
- [ ] Step 5: idempotent MinIO bucket+policy+user
- [ ] Step 6: idempotent realm `doncik` + two clients + audience mapper + roles
- [ ] Step 7: validate infra (compose config, up, init, smoke, rerun idempotent)
- [ ] Step 8: Commit

## Task 5 — DB/transaction/error/migration foundations (`feat(backend): add postgres schema and migration foundation`)
- [ ] Step 1: failing persistence tests (migrations, ETag, outbox)
- [ ] Step 2: shared SQLAlchemy infra (engine, tx boundary, repeatable-read)
- [ ] Step 3: first schema slice (site_state..integration_deliveries), migration 0001
- [ ] Step 4: models_all + alembic config
- [ ] Step 5: DB readiness + dependency-probe contract
- [ ] Step 6: verify migrate head + alembic check
- [ ] Step 7: Commit

## Task 6 — Keycloak JWT verification + backend authz (`feat(auth): protect admin api with keycloak roles`)
- [ ] Step 1: failing token/role tests (in-test RSA/JWKS, capability matrix, default-deny route map)
- [ ] Step 2: split public/internal Keycloak coords + JWKS cache
- [ ] Step 3: principal + capability policy + injectable ClinicScopeProvider, migration 0002
- [ ] Step 4: `/api/v1/admin/me` + boundary (401/403/200)
- [ ] Step 5: restrict CORS/headers
- [ ] Step 6: verify IAM
- [ ] Step 7: Commit

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
