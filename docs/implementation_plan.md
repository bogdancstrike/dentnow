# DentNow Backend, Administration, and Compose Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert DentNow into a Docker Compose-deployable monorepo whose public React site renders PostgreSQL-authored content from a qf backend, while `/admin` provides Keycloak-authenticated CRUD, MinIO media management, live preview, publishing, audit, and `cmdk` quick navigation.

**Architecture:** Split the repository into self-contained `frontend/` and `backend/` components. The qf/Flask modular monolith owns a normalized authoring workspace and immutable publication snapshots in PostgreSQL; MinIO owns binary media. The public site reads only the active publication, while the lazy-loaded admin application authenticates against Keycloak realm `doncik` and uses the same renderers for preview.

**Tech Stack:** React 18, TypeScript, Vite, React Router, TanStack Query, Ant Design 6, `cmdk`, Keycloak JS 26, Python 3.12, qf 1.0.5 (`framework`), Flask/Flask-RESTX, Pydantic 2, SQLAlchemy 2, Alembic, PostgreSQL 18, MinIO/S3, Gunicorn/gevent, pytest, Vitest/Testing Library, Playwright, Docker Compose, nginx, GitHub Actions.

---

## Delivery rules

- Docker Compose is the release target for this plan. Kubernetes/Helm changes are explicitly deferred; the migration notes in `docs/architecture.md` preserve that future path.
- Realm `doncik` is mandatory. Only `/admin` and `/admin/*` initiate browser login. Public routes and public APIs remain anonymous.
- Patient accounts, offer registrations, and patient/clinical data collection are not implemented. The integration/outbox boundary is implemented so a later `patient_engagement` context can be added safely.
- Current content is migrated for rendering parity but is not thereby medically, commercially, or legally approved.
- Use `TIMESTAMPTZ`, `TEXT`, `NUMERIC`, UUIDv7, indexed foreign keys, explicit checks, and normalized core relations as specified in [architecture.md](./architecture.md).
- Use test-first slices. Do not delete a frontend-owned content source until its API-backed replacement has parity coverage.
- Commit after each task with the listed commit subject or an equivalently scoped Conventional Commit message.

## Target repository map

```text
.
├── .github/workflows/
│   ├── ci.yml
│   └── docker-publish.yml
├── backend/
│   ├── Dockerfile
│   ├── config.py
│   ├── main.py
│   ├── wsgi.py
│   ├── gunicorn.conf.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── alembic.ini
│   ├── dist/qf-1.0.5-py3-none-any.whl
│   ├── maps/endpoint.json
│   ├── migrations/
│   ├── scripts/
│   ├── seeds/
│   │   ├── current-site.json
│   │   ├── current-assets.json
│   │   └── assets/
│   ├── src/
│   │   ├── api/
│   │   ├── audit/
│   │   ├── catalog/
│   │   ├── clinics/
│   │   ├── core/
│   │   ├── editorial/
│   │   ├── iam/
│   │   ├── integrations/
│   │   ├── media/
│   │   └── site/
│   └── tests/{unit,integration,contract,architecture,compose}/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── nginx/
│   │   ├── default.conf.template
│   │   └── preview.conf.template
│   ├── public/config.template.json
│   ├── playwright.config.ts
│   ├── scripts/
│   ├── src/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── public-site/
│   │   ├── preview/
│   │   └── shared/
│   └── tests/
├── keycloak/
│   ├── configure-dentnow.sh
│   └── realm-local.json
├── ops/
│   ├── backup-compose.sh
│   ├── restore-compose.sh
│   ├── verify-backup.sh
│   ├── minio_versions.py
│   ├── pre_migrate_backup.sh
│   └── init-secrets.sh
├── deploy/caddy/Caddyfile
├── docs/
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

## Task 1: Establish the baseline and move the frontend into `frontend/`

**Files:**

- Move: `src/` → `frontend/src/`
- Move: `public/` → `frontend/public/`
- Move: `scripts/` → `frontend/scripts/`
- Move: `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `eslint.config.js`, `nginx.conf`, `Dockerfile`, `.dockerignore` → `frontend/`
- Move: `.env` → `frontend/content-source.env` (migration input only; never loaded by Vite)
- Modify: `.gitignore`, `.dockerignore`, `README.md`, `.github/workflows/docker-publish.yml`
- Test: existing frontend build/lint/smoke commands from `frontend/`

- [ ] **Step 1: Record a non-mutating baseline and audit tracked configuration**

  Run:

  ```bash
  git status --short
  gitleaks git --redact --no-banner
  npm ci
  npm run lint
  npx vite build --outDir /tmp/dentnow-baseline
  ```

  Expected: dependency installation succeeds; lint/build results are recorded before paths move. The temporary build does not rewrite `public/sitemap.xml`. Any credential finding stops the task, is rotated, and is removed from history using the repository's incident procedure before work continues.

- [ ] **Step 2: Move frontend-owned files without redesigning them**

  Use `git mv` for tracked paths. Preserve `.env` as `frontend/content-source.env` only after the scan proves it contains current publicly displayed clinic content and no credential; the name prevents automatic Vite loading and Task 13 consumes/deletes it. Renaming does not make a secret safe or remove Git history. Keep `.github/`, `docs/`, `.gitignore`, orchestration files, and the root `README.md` at repository root. Rename `frontend/vite.config.js` to `frontend/vite.config.ts` only after Task 2 introduces TypeScript.

- [ ] **Step 3: Update path-sensitive scripts and documentation**

  `frontend/package.json` continues to resolve `scripts/*`, `src/*`, and `public/*` relative to `frontend/`. Root README commands become:

  ```bash
  npm --prefix frontend ci
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

  The temporary GitHub workflow must set `context: ./frontend` so the repository remains buildable between this task and the final CI task.

- [ ] **Step 4: Verify the pure move**

  Run:

  ```bash
  npm --prefix frontend ci
  npm --prefix frontend run lint
  npm --prefix frontend run build
  npm --prefix frontend run smoke
  ```

  Expected: behavior matches the baseline; generated output is under `frontend/dist/`.

- [ ] **Step 5: Commit**

  ```bash
  git add .
  git commit -m "chore: organize frontend as a monorepo component"
  ```

## Task 2: Add the typed frontend foundation and public runtime config

**Files:**

- Modify: `frontend/package.json`, `frontend/package-lock.json`
- Create: `frontend/tsconfig.json`, `frontend/src/vite-env.d.ts`
- Rename/modify: `frontend/vite.config.js` → `frontend/vite.config.ts`
- Create: `frontend/public/config.template.json`
- Create: `frontend/src/config/runtime.ts`
- Create: `frontend/src/api/http.ts`, `frontend/src/api/contracts.ts`
- Create: `frontend/src/public-site/PublicApp.tsx`
- Modify/rename: `frontend/src/main.jsx` → `frontend/src/main.tsx`, `frontend/src/App.jsx` → `frontend/src/App.tsx`
- Create: `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/tests/setup.ts`, `frontend/tests/msw/handlers.ts`, `frontend/tests/runtime-config.test.ts`

- [ ] **Step 1: Write the runtime-config tests**

  Cover relative API base, explicit preview/Keycloak coordinates, malformed JSON, quotes/newlines/`</script>` values, and failure when a required admin coordinate is missing on bare `/admin` or `/admin/*`. Verify public startup needs only `apiBase` and does not initialize Keycloak.

  Run:

  ```bash
  npm --prefix frontend test -- --run tests/runtime-config.test.ts
  ```

  Expected: FAIL because the typed runtime loader does not exist.

- [ ] **Step 2: Install frontend application and test dependencies**

  Add runtime packages:

  ```text
  @ant-design/icons, @tanstack/react-query, antd@^6, cmdk,
  dompurify, keycloak-js, zod
  ```

  Add development packages:

  ```text
  @ant-design/cli, @playwright/test, @testing-library/jest-dom, @testing-library/react,
  @testing-library/user-event, @types/dompurify, @types/react,
  @types/react-dom, jsdom, msw, typescript, vitest
  ```

  Add scripts `typecheck`, `test`, `test:coverage`, and `e2e` while preserving `dev`, `build`, `lint`, and `smoke`.

- [ ] **Step 3: Implement runtime config with no content defaults**

  The public shape is:

  ```ts
  export interface DentNowRuntimeConfig {
    apiBase: string;
    previewAppUrl?: string;
    keycloakUrl?: string;
    keycloakRealm?: "doncik";
    keycloakClientId?: "dentnow-admin-spa";
    buildRevision?: string;
  }
  ```

  Fetch `/config.json` before mounting React, validate it with Zod, normalize trailing slashes, and validate preview/Keycloak fields only when the admin bundle is requested. The container generates JSON with a real serializer; do not use executable config or textual substitution. Do not add phones, addresses, social links, or other business fallbacks.

  Configure TypeScript with `strict`, `noEmit`, `jsx: "react-jsx"`, `allowJs: true`, and `checkJs: false` so new API/admin code is strict while the existing JSX can migrate route by route instead of requiring an unsafe all-at-once rewrite.

- [ ] **Step 4: Establish the browser-test harness and split entry decisions**

  Configure Playwright now, before any later task writes an E2E spec. A `mock` project starts Vite and uses deterministic MSW/browser fixtures; a `compose` project targets real services and is enabled after Task 20. `App.tsx` renders `PublicApp` for normal routes and lazy-loads `admin/AdminApp` for bare `/admin` and `/admin/*`. The isolated preview entry is selected by its runtime/origin and never initializes Keycloak. Task 2 may use temporary placeholders for admin/preview modules.

- [ ] **Step 5: Verify typed foundation**

  Run:

  ```bash
  npm --prefix frontend run typecheck
  npm --prefix frontend run test -- --run
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

  Expected: all commands pass and the public bundle does not contain `keycloak-js` in its eager entry chunk.

- [ ] **Step 6: Commit**

  ```bash
  git add frontend
  git commit -m "feat(frontend): add typed runtime and split app entry"
  ```

## Task 3: Scaffold the qf backend and prove its contract

**Files:**

- Create: `backend/dist/qf-1.0.5-py3-none-any.whl`
- Create: `backend/requirements.txt`, `backend/requirements-dev.txt`
- Create: `backend/config.py`, `backend/src/config.py`
- Create: `backend/wsgi.py`, `backend/main.py`, `backend/gunicorn.conf.py`
- Create: `backend/maps/endpoint.json`
- Create: `backend/src/api/health.py`, `backend/src/core/errors.py`, `backend/src/core/correlation.py`
- Create: `backend/tests/contract/test_qf_bootstrap.py`, `backend/tests/contract/test_endpoint_map.py`

- [ ] **Step 1: Vendor the exact wheel and record its checksum**

  Copy from the referenced implementation:

  ```bash
  mkdir -p backend/dist
  cp /home/bogdan/workspace/dev/testing_platform/backend/dist/qf-1.0.5-py3-none-any.whl backend/dist/
  echo "1863cd0d57043ebc67b11820d6732b70b95b03738e94ccf10d828a927c5c85ec  backend/dist/qf-1.0.5-py3-none-any.whl" | sha256sum --check
  ```

  Commit the wheel and checksum to `backend/dist/SHA256SUMS`. The absolute sibling path is needed only for this one import step; after this commit, local builds and CI must not read `testing_platform`. Imports use `framework`, not `qf`.

- [ ] **Step 2: Write failing qf contract tests**

  Define runtime requirements for Flask/RESTX, Gunicorn/gevent/psycogreen, SQLAlchemy/psycopg2/Alembic, Pydantic, python-jose/cryptography, requests, boto3, Pillow, Bleach, markdown-it-py, prometheus-client, and python-dotenv. Also install `colorama`, the Redis Python client, and `kafka-python<3` because qf imports its ETL modules eagerly even when `enable_etl=False`; this does not add Redis or Kafka services. Development requirements include pytest/coverage, Ruff, mypy, request/boto stubs, and migration/test helpers. Both requirements files pin every transitive version and hash (generated reproducibly with pip-tools); CI installs with `--require-hashes` and verifies the vendored wheel checksum.

  Assert that:

  - `backend/config.py` exposes `Config` as a top-level module;
  - `wsgi.app` registers `/api/health`, `/api/liveness`, and `/api/readiness`;
  - the app is built with qf ETL disabled;
  - every endpoint-map method is a list and every exec target imports;
  - a handler accepts `(app, operation, request, **kwargs)`.

  Run:

  ```bash
  python -m venv backend/.venv
  backend/.venv/bin/pip install backend/dist/qf-1.0.5-py3-none-any.whl -r backend/requirements.txt -r backend/requirements-dev.txt
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/contract -q
  ```

  Expected: FAIL because the backend scaffold is incomplete.

- [ ] **Step 3: Implement the minimum qf WSGI assembly**

  Use this load-bearing configuration in `backend/wsgi.py`:

  ```python
  settings = FrameworkSettings(
      enable_etl=False,
      enable_api=True,
      enable_dynamic_endpoints=True,
      api_version="1.0",
      api_title="DentNow Content API",
      endpoint_json_path="maps/endpoint.json",
      enable_tracing=Config.ENABLE_TRACING,
      otlp_endpoint=Config.OTLP_ENDPOINT,
      service_name=Config.SERVICE_NAME,
  )
  framework = FrameworkApp(settings, app_root=BASE_DIR)
  handles = framework.run()
  app = handles.app
  install_flask_hooks(app)
  install_flask_error_handlers(app)
  ```

  Apply gevent and psycogreen patches before socket/SSL/database imports. The inspected QTP file is the provenance for this order, but the contract test and committed DentNow code are self-contained. No scheduler or worker is spawned.

- [ ] **Step 4: Add health handlers and a strict endpoint map**

  Use namespace `api`. Health and liveness return process/build identity; readiness initially returns `503`. Task 5 adds PostgreSQL readiness and Task 10 adds the required MinIO bucket probe.

- [ ] **Step 5: Verify qf startup**

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/contract -q
  PYTHONPATH=backend backend/.venv/bin/python -c "from wsgi import app; print(sorted(r.rule for r in app.url_map.iter_rules()))"
  ```

  Expected: contract tests pass and output includes the three `/api/*` health routes.

- [ ] **Step 6: Commit**

  ```bash
  git add backend
  git commit -m "feat(backend): scaffold qf api runtime"
  ```

## Task 4: Build PostgreSQL, MinIO, and Keycloak Compose infrastructure

**Files:**

- Create: `docker-compose.yml`, `.env.example`, `Makefile`, `ops/init-secrets.sh`
- Create: `backend/Dockerfile`, `backend/.dockerignore`
- Create: `backend/docker/postgres/01-create-keycloak.sh`
- Create: `backend/docker/minio/dentnow-policy.json`, `backend/docker/minio/init.sh`
- Create: `keycloak/configure-dentnow.sh`, `keycloak/realm-local.json`
- Modify: `.gitignore`
- Test: `backend/tests/compose/test_infrastructure.sh`

- [ ] **Step 1: Write the infrastructure smoke script**

  It must verify PostgreSQL accepts `SELECT 1`, bucket `dentnow-media` exists with versioning, application MinIO credentials cannot list another bucket, realm `doncik` is discoverable, and both DentNow clients/roles exist.

- [ ] **Step 2: Define pinned persistent services and health checks**

  Use `quay.io/keycloak/keycloak:26.1`, `quay.io/minio/minio:RELEASE.2024-12-18T13-15-44Z`, `quay.io/minio/mc:RELEASE.2024-11-21T17-21-54Z`, and PostgreSQL 18; record resolved digests in the Compose release lock rather than using `latest`. Create named volumes `postgres-data` and `minio-data`; Keycloak persists in its dedicated PostgreSQL database. Keep PostgreSQL and S3 internal by default; local mode exposes only browser ports on loopback.

- [ ] **Step 3: Create the reusable backend image and utility services**

  Add the Python 3.12 multi-stage backend image now so every later migration/integration command runs in the same environment as deployment. Compose defines `migrate`, `seed`, and `api` from this build; the first two are one-shot utility services and may reference commands added by later tasks. During implementation, use `docker compose run --rm --build ...` so each task tests the current backend source.

- [ ] **Step 4: Create isolated databases, identities, and secret files**

  PostgreSQL initializes database/user `dentnow` for the API and database/user `keycloak` for Keycloak. `ops/init-secrets.sh` creates mode-`0600` random files under ignored `.secrets/`; services consume Compose secrets through `*_FILE`, never normal production environment values. The shell script uses fixed SQL identifiers and psql variables for password values; it never interpolates an arbitrary identifier. It refuses weak/example secrets and refuses to overwrite existing files without an explicit rotate command.

- [ ] **Step 5: Bootstrap private MinIO storage idempotently**

  `minio-init` must:

  ```text
  create dentnow-media if absent
  enable bucket versioning
  create/update policy dentnow-media-rw restricted to that bucket
  create/update the DentNow application user
  attach only dentnow-media-rw
  ```

  Root MinIO credentials are used only by the one-shot init container. The API receives only application credentials.

- [ ] **Step 6: Bootstrap realm `doncik` idempotently**

  `configure-dentnow.sh` waits for Keycloak, signs in with `kcadm.sh`, creates realm `doncik` only when absent, and upserts:

  - public PKCE client `dentnow-admin-spa`;
  - non-interactive resource client `dentnow-api`, with all login/service-account flows disabled and no backend-consumed secret;
  - access-token audience mapper;
  - realm roles `dentnow_admin`, `dentnow_editor`, `dentnow_publisher`, `dentnow_clinic_manager`;
  - the local development admin only when `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` are set.

  Redirect URIs and web origins come from `PUBLIC_APP_URL`; direct access grants and implicit flow remain disabled. Tokens issued to the SPA contain `aud=dentnow-api` and `azp=dentnow-admin-spa`.

  Configure Keycloak hostname v2 explicitly: canonical `PUBLIC_KEYCLOAK_URL` determines the issuer, internal backchannel discovery permits API JWKS fetches at `http://keycloak:8080`, HTTP is private to Compose, and trusted proxy headers are enabled only behind the declared edge. Production uses `start`, strict HTTPS hostnames, and no seeded account; local mode may use `start-dev`.

  When and only when `SEED_E2E_USERS=true` in a disposable local/CI project, create deterministic admin/editor/publisher/clinic-manager/no-role users with generated test passwords supplied as secret files. The later E2E fixture resolves their Keycloak subjects and assigns clinic scopes after the clinic schema exists.

  `realm-local.json` is the reproducible local/test fixture for an empty Keycloak database. `configure-dentnow.sh` is the authoritative idempotent updater and must never replace or re-import an existing `doncik` realm wholesale.

- [ ] **Step 7: Validate Compose infrastructure**

  Run:

  ```bash
  cp .env.example .env
  ./ops/init-secrets.sh
  docker compose config --quiet
  docker compose up -d postgres minio keycloak
  docker compose run --rm minio-init
  docker compose run --rm keycloak-config
  bash backend/tests/compose/test_infrastructure.sh
  ```

  Expected: all probes pass. Repeat both init services and expect success with no duplicate resources.

- [ ] **Step 8: Commit**

  ```bash
  git add docker-compose.yml .env.example Makefile backend/Dockerfile backend/.dockerignore backend/docker keycloak ops/init-secrets.sh .gitignore
  git commit -m "feat(compose): provision postgres minio and keycloak"
  ```

## Task 5: Add database, transaction, error, and migration foundations

**Files:**

- Create: `backend/alembic.ini`, `backend/migrations/env.py`, `backend/migrations/script.py.mako`
- Create: `backend/src/core/db.py`, `backend/src/core/pagination.py`, `backend/src/core/etag.py`, `backend/src/core/clock.py`
- Create: `backend/src/site/models.py`, `backend/src/audit/models.py`, `backend/src/integrations/models.py`
- Create: `backend/src/models_all.py`
- Create: `backend/migrations/versions/0001_site_audit_outbox.py`
- Modify: `backend/src/config.py`, `backend/src/api/health.py`
- Test: `backend/tests/integration/test_migrations.py`, `backend/tests/unit/test_etags.py`, `backend/tests/unit/test_outbox.py`

- [ ] **Step 1: Write failing persistence tests**

  Test migration from an empty PostgreSQL database, downgrade/upgrade round trip, UTC timestamps, UUIDv7 IDs, indexed foreign keys, optimistic ETag parsing, append-only audit behavior, and an outbox row committed in the same transaction as a sample site mutation.

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_etags.py backend/tests/unit/test_outbox.py -q
  docker compose run --rm --build migrate alembic upgrade head
  ```

  Expected: FAIL because persistence modules and migrations do not exist.

- [ ] **Step 2: Implement shared SQLAlchemy infrastructure**

  Follow the tested `testing_platform/backend/src/core/db.py` transaction boundary: one cached engine, `pool_pre_ping`, bounded pool settings, `expire_on_commit=False`, rollback on exception, and no domain imports from `core`. Add isolation selection for repeatable-read publication transactions.

- [ ] **Step 3: Implement the first normalized schema slice**

  Create the architecture-defined site/publication foundation:

  ```text
  site_state, site_links, navigation_menus, navigation_items,
  pages, page_sections, page_seo, site_publications,
  preview_sessions, audit_events,
  integration_outbox, integration_bindings, integration_deliveries
  ```

  Add all live-path uniqueness, JSON-object checks, status checks, foreign-key indexes, outbox pending index, and immutable-publication safeguards. `site_publications.snapshot` and event payloads are JSONB; core relations are not collapsed into JSON. Media foreign keys and `publication_media` are added in Task 10 after `media_assets` exists.

- [ ] **Step 4: Register complete metadata and Alembic config**

  `models_all.py` imports every model module. Alembic reads `Config.DATABASE_URL` and `Base.metadata`; migration scripts are deterministic and never use `Base.metadata.create_all()` in application startup.

- [ ] **Step 5: Add database readiness and the dependency-probe contract**

  `/api/readiness` executes `SELECT 1` and calls a registered dependency-probe collection that can be stubbed in tests. At this stage only PostgreSQL is registered; Task 10 registers the real MinIO bucket stat and makes it mandatory. The public response is only generic ready/not-ready; dependency names/details stay in internal logs/metrics and never include credentials or raw DSNs.

- [ ] **Step 6: Verify migrations and constraints**

  Run:

  ```bash
  docker compose up -d postgres minio
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit backend/tests/integration/test_migrations.py -q
  docker compose run --rm --build migrate alembic check
  ```

  Expected: migration reaches head, tests pass, and Alembic reports no model/schema drift.

- [ ] **Step 7: Commit**

  ```bash
  git add backend
  git commit -m "feat(backend): add postgres schema and migration foundation"
  ```

## Task 6: Implement Keycloak JWT verification and backend authorization

**Files:**

- Create: `backend/src/iam/principal.py`, `backend/src/iam/token_verifier.py`, `backend/src/iam/decorators.py`, `backend/src/iam/capabilities.py`, `backend/src/iam/service.py`, `backend/src/iam/models.py`
- Create: `backend/src/api/me.py`
- Create: `backend/migrations/versions/0002_admin_principals.py`
- Modify: `backend/maps/endpoint.json`, `backend/src/models_all.py`, `backend/src/core/correlation.py`
- Test: `backend/tests/unit/test_token_verifier.py`, `backend/tests/unit/test_authorization.py`, `backend/tests/contract/test_admin_auth_boundary.py`

- [ ] **Step 1: Write failing token and role tests**

  Generate an in-test RSA key/JWKS and cover valid token, unknown `kid`, bad signature, expired token, wrong issuer, wrong audience, wrong/missing `azp`, missing bearer token, missing role, the exact capability matrix, admin implication, editor/publisher separation, and clinic-scope denial. The route-map test enumerates every `/api/v1/admin/*` method and fails if it lacks the default-deny auth/capability wrapper.

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_token_verifier.py backend/tests/unit/test_authorization.py -q
  ```

  Expected: FAIL because IAM modules do not exist.

- [ ] **Step 2: Implement split public/internal Keycloak coordinates**

  Configuration must expose:

  ```text
  KEYCLOAK_PUBLIC_URL, KEYCLOAK_INTERNAL_URL, KEYCLOAK_REALM=doncik,
  KEYCLOAK_ISSUER, KEYCLOAK_JWKS_URL, KEYCLOAK_AUDIENCE=dentnow-api,
  KEYCLOAK_AUTHORIZED_PARTY=dentnow-admin-spa,
  JWKS_CACHE_TTL
  ```

  Fetch JWKS internally, validate public issuer, audience, and exact `azp`, cache by `kid`, and refresh once on an unknown key to support Keycloak rotation.

- [ ] **Step 3: Implement principal and permission policy**

  Map only the four `dentnow_*` realm roles into the architecture section 9.3 capability matrix. `dentnow_admin` implies all content capabilities. This migration stores only `admin_principals` Keycloak subject/last-seen metadata and never passwords; Task 7 creates `admin_principal_clinics` after `clinics` exists. Define an injectable `ClinicScopeProvider` now so unit tests can prove scope behavior without owning that later table. Decorators inject `principal` into the exact qf handler signature and return the common JSON error envelope.

- [ ] **Step 4: Register `/api/v1/admin/me` and prove the boundary**

  Public routes must return `200` without a token. Every admin read and write is denied by default. `/api/v1/admin/me` returns `401` without a token, `403` without a DentNow role, and a redacted principal/roles/scopes payload with a valid token.

- [ ] **Step 5: Restrict CORS and headers**

  Allow configured local origins only, answer `OPTIONS`, echo `X-Correlation-Id`, and include `Authorization, Content-Type, If-Match, X-Correlation-Id` in allowed headers. Production same-origin operation does not use wildcard CORS.

- [ ] **Step 6: Verify IAM**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_token_verifier.py backend/tests/unit/test_authorization.py backend/tests/contract/test_admin_auth_boundary.py -q
  ```

  Expected: all IAM tests pass.

- [ ] **Step 7: Commit**

  ```bash
  git add backend
  git commit -m "feat(auth): protect admin api with keycloak roles"
  ```

## Task 7: Implement site settings, navigation, pages, and clinic CRUD

**Files:**

- Create: `backend/src/site/schemas.py`, `backend/src/site/repository.py`, `backend/src/site/service.py`, `backend/src/site/serializers.py`
- Create: `backend/src/clinics/models.py`, `backend/src/clinics/schemas.py`, `backend/src/clinics/repository.py`, `backend/src/clinics/service.py`, `backend/src/clinics/serializers.py`
- Create: `backend/src/api/site_admin.py`, `backend/src/api/clinics_admin.py`, `backend/src/api/access_admin.py`
- Create: `backend/migrations/versions/0003_clinics_people.py`
- Modify: `backend/maps/endpoint.json`, `backend/src/models_all.py`
- Test: `backend/tests/unit/test_site_service.py`, `backend/tests/unit/test_clinic_service.py`, `backend/tests/integration/test_site_clinic_crud.py`

- [ ] **Step 1: Write failing domain and API tests**

  Cover site singleton update, unique live page path, valid registered template/block types, navigation cycle prevention, broken target rejection, three-clinic CRUD, contacts, unique weekday hours, transit/FAQ ordering, doctor-clinic mapping, soft delete, ETag/`If-Match`, audit creation, clinic-manager get/list/search/nested scope, and admin-only principal-scope CRUD.

- [ ] **Step 2: Implement clinic/person schema**

  Add `clinics`, `clinic_contacts`, `clinic_hours`, `clinic_transit_items`, `clinic_faqs`, `doctors`, `doctor_clinics`, and `admin_principal_clinics` exactly as defined in the architecture. This migration is the sole owner of `admin_principal_clinics` because its clinic FK now exists; wire it as the Task 6 `ClinicScopeProvider`. Normalize phone values while retaining display values; validate coordinates, URLs, time ranges, and contact kinds.

- [ ] **Step 3: Implement explicit services and serializers**

  Repositories perform persistence only. Services enforce permissions, scope, ordering, conflict rules, audit writes, outbox event creation, and workspace-version increments. Serializers expose stable API names and ISO timestamps, never ORM instances.

- [ ] **Step 4: Register administration endpoints**

  Add list/get/create/patch/delete routes for site links, menus/items, pages/sections/SEO, clinics and their child resources, doctors, and doctor-clinic mappings. Add admin-only principal listing and clinic-scope assign/remove endpoints; no endpoint creates passwords or Keycloak users. Use Pydantic request parsing and qf `Empty` models for complex payloads. Lists use `page`, `page_size`, `q`, `sort`, and `order` with allowlisted sort columns.

- [ ] **Step 5: Verify CRUD and concurrency**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_site_service.py backend/tests/unit/test_clinic_service.py backend/tests/integration/test_site_clinic_crud.py -q
  ```

  Expected: all tests pass, including stale ETag `409` and cross-clinic `403`.

- [ ] **Step 6: Commit**

  ```bash
  git add backend
  git commit -m "feat(cms): add site page and clinic management"
  ```

## Task 8: Implement treatments, prices, offers, technology, and partner CRUD

**Files:**

- Create: `backend/src/catalog/models.py`, `backend/src/catalog/schemas.py`, `backend/src/catalog/repository.py`, `backend/src/catalog/service.py`, `backend/src/catalog/serializers.py`
- Create: `backend/src/api/catalog_admin.py`
- Create: `backend/migrations/versions/0004_catalog_offers.py`
- Modify: `backend/maps/endpoint.json`, `backend/src/models_all.py`
- Test: `backend/tests/unit/test_catalog_service.py`, `backend/tests/integration/test_catalog_crud.py`

- [ ] **Step 1: Write failing catalog rule tests**

  Cover unique slugs, category/order behavior, exact/from/range/on-request prices, non-negative and ordered ranges, currency validation, clinic availability, offer start/end rules, expired-offer exclusion, features, treatment links, technology/partner rights metadata, scope authorization, ETags, audit, and outbox events.

- [ ] **Step 2: Add normalized catalog schema and constraints**

  Implement every catalog table listed in architecture section 11.3 with indexed FKs and checks. Do not store formatted values such as `1.490 lei` as the authoritative price; serializers format `NUMERIC` plus currency/price kind for the frontend locale.

- [ ] **Step 3: Implement services and qf handlers**

  Add server-paginated CRUD for categories, treatments, prices, FAQs, explicit `/api/v1/admin/clinic-treatments` availability mappings, offers, features, offer mappings, technologies, and partners. A clinic manager may read/search/edit only records scoped to an assigned clinic; shared/global catalog edits require editor/admin/publisher according to the capability matrix.

- [ ] **Step 4: Verify catalog behavior**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_catalog_service.py backend/tests/integration/test_catalog_crud.py -q
  ```

  Expected: tests pass and database checks reject invalid prices/date windows independently of API validation.

- [ ] **Step 5: Commit**

  ```bash
  git add backend
  git commit -m "feat(cms): add treatments prices offers and partners"
  ```

## Task 9: Implement editorial, legal, review, case, ebook, and quiz CRUD

**Files:**

- Create: `backend/src/editorial/models.py`, `backend/src/editorial/schemas.py`, `backend/src/editorial/repository.py`, `backend/src/editorial/service.py`, `backend/src/editorial/serializers.py`, `backend/src/editorial/rich_text.py`
- Create: `backend/src/audit/repository.py`, `backend/src/audit/service.py`, `backend/src/audit/serializers.py`
- Create: `backend/src/api/editorial_admin.py`, `backend/src/api/audit_admin.py`
- Create: `backend/migrations/versions/0005_editorial_legal_quiz.py`
- Modify: `backend/maps/endpoint.json`, `backend/src/models_all.py`
- Test: `backend/tests/unit/test_rich_text.py`, `backend/tests/unit/test_editorial_service.py`, `backend/tests/unit/test_audit_service.py`, `backend/tests/integration/test_editorial_crud.py`, `backend/tests/integration/test_audit_query.py`

- [ ] **Step 1: Write failing sanitization and editorial tests**

  Cover scripts, event attributes, unsafe URL schemes, iframes, raw style, malformed Markdown, unique slugs, exact review dates/ratings, review verification metadata, legal version/effective date, case disclaimer/attestation state, ebook download relation, quiz question/option ordering, score-band overlap/gaps, ETags, append-only/schema-redacted audit, audit pagination/filtering, and publisher/admin-only audit reads.

- [ ] **Step 2: Implement safe rich text**

  Store Markdown source, render with a fixed Markdown feature set, and sanitize with an explicit Bleach tag/attribute/protocol allowlist. All authored link fields use per-field scheme/host allowlists. Publication runs the same sanitizer again. Page headings stay plain text. Return sanitized HTML only in explicit `rendered_html` fields.

- [ ] **Step 3: Add normalized editorial schema**

  Implement `articles`, `news_items`, `reviews`, `case_studies`, `ebooks`, `legal_documents`, `quizzes`, `quiz_questions`, `quiz_options`, and `quiz_result_bands`. Keep media FKs nullable until Task 10, then add/validate the relationships in its migration.

- [ ] **Step 4: Register explicit CRUD handlers**

  Expose server-paginated resources and nested quiz operations. Legal approval fields and case-image attestation state require publisher/admin. Relative review dates are forbidden; the frontend derives relative display from an exact date. Add read-only, redacted `/api/v1/admin/audit-events` list/detail handlers with actor/action/entity/time filters for publisher/admin; application credentials cannot update/delete audit rows.

- [ ] **Step 5: Verify editorial APIs**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_rich_text.py backend/tests/unit/test_editorial_service.py backend/tests/unit/test_audit_service.py backend/tests/integration/test_editorial_crud.py backend/tests/integration/test_audit_query.py -q
  ```

  Expected: tests pass and malicious stored content never appears in `rendered_html`.

- [ ] **Step 6: Commit**

  ```bash
  git add backend
  git commit -m "feat(cms): add editorial legal and quiz management"
  ```

## Task 10: Implement private MinIO media management and consent gates

**Files:**

- Create: `backend/src/media/models.py`, `backend/src/media/schemas.py`, `backend/src/media/ports.py`
- Create: `backend/src/media/minio_storage.py`, `backend/src/media/image_processor.py`, `backend/src/media/service.py`, `backend/src/media/serializers.py`
- Create: `backend/src/api/media_admin.py`, `backend/src/api/media_public.py`
- Create: `backend/scripts/gc_media.py`
- Create: `backend/migrations/versions/0006_media_assets.py`
- Modify: `backend/src/editorial/models.py`, `backend/src/models_all.py`, `backend/src/api/health.py`, `backend/maps/endpoint.json`
- Test: `backend/tests/unit/test_media_service.py`, `backend/tests/unit/test_image_processor.py`, `backend/tests/unit/test_media_gc.py`, `backend/tests/integration/test_minio_media.py`

- [ ] **Step 1: Write failing media/security tests**

  Cover allowed raster formats, real MIME sniffing, maximum bytes/pixels, decompression bombs, EXIF removal, random object keys, SHA-256, variant dimensions, duplicate upload behavior, alt-text requirement, private bucket policy, public-reference check, preview-cookie check, ebook PDF disposition/quarantine hook, unsupported SVG/HTML rejection, de-identified case-image attestation, delivery block on expiry/revocation, short consent-bound caching, and deletion blocked by workspace/publication/preview references.

- [ ] **Step 2: Implement storage and processing ports**

  Domain/application code depends on `ObjectStoragePort` and `ImageProcessorPort`. The boto3 MinIO adapter configures explicit endpoint, region, path-style addressing, timeouts, and application credentials. No S3 object URL or credential leaks into a public serializer.

- [ ] **Step 3: Implement media schema**

  Add `media_assets`, `media_variants`, `content_media_links`, `publication_media`, `media_consents`, and `media_delivery_blocks`; add validated FKs from doctor/article/news/case/ebook/SEO/partner/technology records. Consent rows store only non-identifying publication attestations and opaque references to evidence held in the clinic-approved system—never patient identity or consent-document bytes. Store opaque object keys, original display filename, MIME, dimensions, checksum, rights/alt/caption/focal metadata, readiness, privacy class, and soft-delete state.

- [ ] **Step 4: Implement streaming upload and variants**

  Stream to a bounded temporary file, identify/decode, scan/quarantine supported downloads, re-encode images, upload original plus `thumbnail`, `card`, and `hero` variants, then commit metadata. Deduplicate only inside the same privacy class. On failure, delete newly uploaded objects or record them for orphan cleanup. Never hold an unbounded request in memory.

- [ ] **Step 5: Implement media delivery rules**

  Admin content requires bearer authorization. Public content is served only when the asset appears in the active publication. Preview content requires the isolated-origin preview cookie. Emit correct `Content-Type`, ETag, `Content-Length`, range behavior where supported, and safe disposition. Ordinary variants are immutable; consent-bound variants check the mutable block/attestation on every request, use short revalidation, and return `410` after expiry/revocation.

- [ ] **Step 6: Complete readiness and explicit media garbage collection**

  Register a mandatory MinIO bucket-stat probe so final readiness always fails generically when PostgreSQL or MinIO is unavailable. Implement `gc_media.py` as an idempotent command: dry-run by default, respect workspace/retained-publication/active-preview/retention references, acquire the maintenance lock, and require `--confirm-delete` for mutation. Document host cron/systemd invocation; do not add an in-process scheduler.

- [ ] **Step 7: Verify against real MinIO**

  Run:

  ```bash
  docker compose up -d postgres minio
  docker compose run --rm minio-init
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_media_service.py backend/tests/unit/test_image_processor.py backend/tests/unit/test_media_gc.py backend/tests/integration/test_minio_media.py -q
  docker compose run --rm --build api python scripts/gc_media.py --dry-run
  ```

  Expected: all tests pass; MinIO application credentials cannot access any non-DentNow bucket.

- [ ] **Step 8: Commit**

  ```bash
  git add backend
  git commit -m "feat(media): manage private minio assets and consent"
  ```

## Task 11: Implement deterministic preview, publication, rollback, and public APIs

**Files:**

- Create: `backend/src/site/snapshot_contract.py`, `backend/src/site/snapshot_builder.py`, `backend/src/site/publication_validator.py`, `backend/src/site/publication_service.py`
- Create: `backend/src/api/public_content.py`, `backend/src/api/publications_admin.py`, `backend/src/api/previews.py`
- Create: `backend/migrations/versions/0007_publication_guards.py`
- Modify: `backend/maps/endpoint.json`, `backend/src/media/service.py`
- Test: `backend/tests/unit/test_snapshot_builder.py`, `backend/tests/unit/test_publication_validator.py`, `backend/tests/integration/test_publication_flow.py`, `backend/tests/contract/test_public_api.py`

- [ ] **Step 1: Write failing snapshot/publication tests**

  Cover deterministic canonical JSON/hash, stable ordering, one-release consistency, route uniqueness, broken navigation, missing clinic fields, invalid prices/offers, configured required legal types (`gdpr`, `privacy`, `terms` initially), unsafe rich text/typed JSON-LD, missing alt/rights/attestation, advisory-lock serialization, repeatable-read behavior, unchanged-workspace no-op, active-pointer atomicity, compatible/incompatible activation, current consent-block revalidation on rollback, exact restore-workspace ID/deletion/media semantics, audit/outbox reasons, one-use preview exchange/expiry/revocation, ETags, `304`, and media reference materialization.

- [ ] **Step 2: Define and version `SiteSnapshotV1`**

  Use Pydantic discriminated unions for page sections and an explicit top-level schema:

  ```python
  class SiteSnapshotV1(BaseModel):
      schema_version: Literal[1]
      site: SitePublic
      links: list[LinkPublic]
      navigation: dict[str, list[NavigationItemPublic]]
      clinics: list[ClinicPublic]
      pages_by_path: dict[str, PagePublic]
      treatments: list[TreatmentPublic]
      offers: list[OfferPublic]
      editorial: EditorialPublic
      media: dict[str, MediaPublic]
  ```

  Unknown block kinds and fields are rejected. Serialization sorts all unordered collections by stable business keys. SEO structured data is generated from typed schemas only; the frontend receives no raw administrator-authored JSON-LD.

- [ ] **Step 3: Implement validation and atomic publish**

  Under a PostgreSQL advisory lock and repeatable-read transaction, validate the complete workspace, insert immutable snapshot/media links, update the active pointer, write audit, and enqueue `site.publication.activated.v1` in `integration_outbox`. Validation-only returns all field/entity errors without mutating state. An unchanged workspace returns the current publication with `changed: false` and creates nothing. Activating an older schema-compatible release revalidates current media rights/blocks, records reason `rollback`, and leaves workspace rows unchanged.

- [ ] **Step 4: Implement previews and rollback**

  Hash a 256-bit one-use preview token, freeze the principal's permitted snapshot, and set 15-minute expiry. Implement exact routes `POST /api/v1/preview/session`, `GET /api/v1/preview/bootstrap`, `GET /api/v1/preview/pages/by-path`, article list/detail, media, and `DELETE /api/v1/preview/session`. The token arrives only in the isolated preview URL fragment, is exchanged once for a host-only HttpOnly/SameSite cookie, and is then invalidated. Preview JSON/media is `no-store`/`noindex`.

  `restore-workspace` is admin-only: upsert stable IDs, replace ordered relations, soft-delete rows absent from the snapshot, preserve retained media, increment workspace version, audit/enqueue `site.workspace.restored.v1`, and leave the live pointer unchanged. It requires a later normal publish.

- [ ] **Step 5: Implement public read surface**

  Register architecture section 12.1 routes for bootstrap, page-by-path, article list/detail, media, and sitemap. Every response comes from one active publication, carries `release_version`, and supports content-hash ETags. Public endpoints never fall back to workspace rows.

- [ ] **Step 6: Verify publication contracts**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_snapshot_builder.py backend/tests/unit/test_publication_validator.py backend/tests/integration/test_publication_flow.py backend/tests/contract/test_public_api.py -q
  ```

  Expected: all tests pass, including rollback of content and media as one unit.

- [ ] **Step 7: Commit**

  ```bash
  git add backend
  git commit -m "feat(publishing): add previews immutable releases and public api"
  ```

## Task 12: Formalize the future integration boundary without collecting patient data

**Files:**

- Create: `backend/src/integrations/events.py`, `backend/src/integrations/ports.py`, `backend/src/integrations/outbox.py`, `backend/src/integrations/serializers.py`
- Create: `backend/docs/integration-contracts.md`
- Test: `backend/tests/unit/test_domain_events.py`, `backend/tests/architecture/test_dependency_rules.py`

- [ ] **Step 1: Write failing event/dependency tests**

  Assert stable event envelope/versioning, idempotency ID, actor/correlation metadata, redacted payload rules, transactional insertion, and that `site`, `clinics`, `catalog`, and `editorial` do not import vendor SDKs or adapter modules.

- [ ] **Step 2: Define the event envelope and current events**

  The envelope contains event ID, type with `.v1` suffix, aggregate type/ID, occurred time, schema version, correlation ID, and a minimal non-PII payload. Implement events for publication activation, clinic update, treatment update, and offer publish/expire.

- [ ] **Step 3: Define outbound/inbound ports**

  Document HTTP/webhook/Kafka/vendor adapters as replaceable implementations, external-ID binding rules, signed inbound requests, idempotency, retry/dead-letter semantics, and provider-specific anti-corruption mapping. Do not implement a relay, webhook receiver, patient table, registration route, or qf ETL worker in this release.

- [ ] **Step 4: Add the future patient-engagement guardrail**

  `integration-contracts.md` must require a separate bounded context/schema with separate database credentials, encryption keys, egress allowlists, purpose/versioned consent, retention/export/delete, stricter roles, redacted audit, and a new threat/regulatory assessment before any offer/patient registration endpoint is enabled. Clinical/health records trigger a separate service/database decision. Explicitly prohibit adding patient fields to CMS content tables.

- [ ] **Step 5: Verify boundaries**

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_domain_events.py backend/tests/architecture/test_dependency_rules.py -q
  ```

  Expected: tests pass and no current public endpoint accepts patient/registration data.

- [ ] **Step 6: Commit**

  ```bash
  git add backend
  git commit -m "feat(integrations): add versioned outbox extension boundary"
  ```

## Task 13: Export and seed every current content source

**Files:**

- Create: `frontend/scripts/export-current-content.mjs`
- Create: `backend/seeds/current-site.json`, `backend/seeds/current-assets.json`, `backend/seeds/assets/`
- Create: `backend/scripts/seed_current_site.py`, `backend/scripts/verify_seed_parity.py`
- Delete after verified export: `frontend/content-source.env`
- Create: `backend/tests/integration/test_seed_idempotency.py`, `backend/tests/integration/test_seed_parity.py`
- Read/migrate: all current files listed in architecture section 3

- [ ] **Step 1: Write the parity manifest and failing tests**

  The expected minimum inventory is:

  ```json
  {
    "clinics": 3,
    "phone_lines": 2,
    "services": 6,
    "offers": 6,
    "treatment_categories": 10,
    "treatment_price_rows": 20,
    "partners": 6,
    "case_studies": 3,
    "ebooks": 6,
    "news_items": 3,
    "quiz_questions": 7,
    "quiz_options": 28,
    "articles": 17,
    "reviews": 9
  }
  ```

  Tests also require the literal route inventory in architecture section 3.1, location details/FAQs/transit, four treatment landing pages, emergency/CAS content, the three currently required legal documents (`gdpr`, `privacy`, `terms`; cookies remain optional until configured), navigation variants, section copy, SEO, and every referenced DentNow asset.

- [ ] **Step 2: Export centralized JavaScript data deterministically**

  The Node exporter imports `frontend/src/data/*.js`, `frontend/src/config.js`, and the migration-only `frontend/content-source.env` in a controlled build-time environment and writes normalized JSON. It does not scrape JSX with regex. Copy/move every referenced content asset from `frontend/public/assets/dentnow` into committed `backend/seeds/assets/`, and write relative paths, sizes, MIME types, and SHA-256 values to `current-assets.json`. The backend Docker context/image must include this bundle; seeding must never rely on a frontend bind mount or sibling build context. Delete `content-source.env` after the committed seed fixture and parity tests contain every mapped value.

- [ ] **Step 3: Add explicit mappings for page-local content**

  Move page-local datasets into the seed fixture with a `source_path` field used only by parity reports. Resolve duplicate clinic/contact/schedule records into one canonical entity while verifying every current displayed value maps to a target field or an intentional reviewed replacement.

- [ ] **Step 4: Seed database and MinIO idempotently**

  The Python seed imports only when no seeded site exists, reads packaged `backend/seeds/assets`, verifies manifest checksums, uploads assets/variants, creates normalized rows, and marks unverified claims as `needs_review`. It may create one auditable `migration_baseline` publication only on a completely empty database, representing content already public before migration; this does not approve any claim and cannot be invoked after a workspace mutation. Re-running returns a no-change summary and never overwrites admin edits.

- [ ] **Step 5: Verify the complete migration**

  Run:

  ```bash
  docker compose run --rm --build migrate alembic upgrade head
  docker compose run --rm --build seed
  docker compose run --rm --build seed
  docker compose run --rm --build api python scripts/verify_seed_parity.py
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/integration/test_seed_idempotency.py backend/tests/integration/test_seed_parity.py -q
  ```

  Expected: first seed creates content/media from the backend image alone, second reports no changes, parity reports zero unmapped content paths and zero missing media objects, and no frontend-volume mount is present.

- [ ] **Step 6: Commit**

  ```bash
  git add backend frontend
  git commit -m "feat(migration): seed current dentnow content and media"
  ```

## Task 14: Refactor the public React site to render only backend data

**Files:**

- Create: `frontend/src/api/publicClient.ts`, `frontend/src/api/publicContracts.ts`
- Create: `frontend/src/public-site/SiteDataProvider.tsx`, `frontend/src/public-site/SiteRouter.tsx`, `frontend/src/public-site/blockRegistry.tsx`
- Create: `frontend/src/public-site/renderers/` for every supported template/block
- Move/adapt: existing `frontend/src/pages`, `components`, `hooks`, and styles into `frontend/src/public-site/`
- Delete after parity: `frontend/src/data/`, business fallbacks in `frontend/src/config.js`, and page-local content constants
- Test: `frontend/tests/public-site/*.test.tsx`, `frontend/tests/no-hardcoded-content.test.ts`, `frontend/e2e/public-routes.spec.ts`

- [ ] **Step 1: Write failing provider and no-fallback tests**

  Use MSW to cover bootstrap/page success, `304`, loading, API unavailable, unknown route, empty optional section, stale release refresh, and preview snapshot. The guard test scans frontend runtime modules for imports from retired content files and known clinic values such as phone/address/price literals.

- [ ] **Step 2: Implement typed public API clients and query keys**

  Public requests have no bearer token. Query keys include active release/version; page results from one version cannot be combined with bootstrap from another. On a mismatch, invalidate and refetch as a unit.

- [ ] **Step 3: Convert every route to a pure renderer**

  Cover home, treatments/tariffs, treatment detail, offers, article index/detail, reviews/redirect, cases, news, quiz, partners, ebooks, clinic/location aliases, emergency, CAS, GDPR/privacy/terms, and 404. Components receive contract props or context selectors; they do not import business data.

- [ ] **Step 4: Replace unsafe and duplicated behavior**

  Render plain headings without HTML injection, render sanitized rich text through one defensive component, derive review relative dates from exact dates, derive prices from numeric contracts, derive JSON-LD facts from backend SEO, and derive phone/WhatsApp/contact actions from selected clinic data.

- [ ] **Step 5: Remove retired data only after route parity passes**

  Delete `frontend/src/data`, page-local datasets, Vite content variables, static sitemap generation, and bundled content-asset references. Keep UI-only icons/styles and explicit loading/error copy in code.

- [ ] **Step 6: Verify all public routes anonymously**

  Run:

  ```bash
  npm --prefix frontend run typecheck
  npm --prefix frontend run test -- --run
  npm --prefix frontend run lint
  npm --prefix frontend run build
  npm --prefix frontend run e2e -- --project=mock public-routes.spec.ts
  ```

  Expected: every current route renders from deterministic API fixtures; no test or runtime import depends on retired content modules; no Keycloak redirect occurs. Task 22 repeats the route journey against the real Compose stack.

- [ ] **Step 7: Commit**

  ```bash
  git add frontend
  git commit -m "feat(frontend): render public site from published api data"
  ```

## Task 15: Add the Keycloak-authenticated admin shell

**Files:**

- Create: `frontend/src/admin/auth/keycloak.ts`, `frontend/src/admin/auth/AdminAuthBoundary.tsx`, `frontend/src/admin/auth/permissions.ts`
- Create: `frontend/src/admin/api/adminClient.ts`, `frontend/src/admin/api/adminContracts.ts`, `frontend/src/admin/api/queryKeys.ts`
- Create: `frontend/src/admin/AdminApp.tsx`, `frontend/src/admin/layout/AdminLayout.tsx`, `frontend/src/admin/theme.ts`
- Create: `frontend/src/admin/pages/OverviewPage.tsx`, `frontend/src/admin/pages/AccessDeniedPage.tsx`
- Create: `backend/scripts/seed_e2e_identities.py`, `backend/tests/compose/test_e2e_fixtures.sh`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/tests/admin/auth.test.tsx`, `frontend/tests/admin/admin-client.test.ts`, `frontend/e2e/admin-auth.spec.ts`, `backend/tests/compose/test_e2e_fixtures.sh`

- [ ] **Step 1: Write failing route/auth/client tests**

  Cover public startup without Keycloak, `/admin` login-required startup, PKCE S256 options, token refresh within 30 seconds, in-memory token use, bearer attachment only to admin requests, 401 relogin, 403 access page, logout to `/`, restoration of the requested admin URL, and absence of admin routes for principals with no DentNow role.

- [ ] **Step 2: Implement lazy Keycloak initialization**

  Create Keycloak only from the admin bundle using runtime client `dentnow-admin-spa`, realm `doncik`, and configured browser URL. Use `onLoad: "login-required"`, `pkceMethod: "S256"`, and `checkLoginIframe: false`. Never persist access/refresh tokens in local/session storage.

- [ ] **Step 3: Implement the admin API client**

  Refresh before requests, attach bearer/correlation/`If-Match`, parse the common error envelope, retain response ETags, and expose cancellation through `AbortSignal`. A 409 returns a typed version-conflict result rather than a generic toast.

- [ ] **Step 4: Build the shell with one Ant Design provider**

  Before component work, inspect official APIs:

  ```bash
  npm --prefix frontend exec -- antd info ConfigProvider --format json
  npm --prefix frontend exec -- antd info Layout --format json
  npm --prefix frontend exec -- antd info Menu --format json
  npm --prefix frontend exec -- antd info App --format json
  ```

  Use one `ConfigProvider` plus Ant `App` inside the lazy admin root, token-based theming, responsive sidebar/drawer navigation, header identity/logout, publication status placeholder, and accessible skip/main landmarks. Do not target `.ant-*` selectors.

- [ ] **Step 5: Load `/admin/me` before rendering protected navigation**

  Derive allowed route/menu/action presentation from effective backend permissions and clinic scopes. Backend authorization remains authoritative.

- [ ] **Step 6: Add a disposable real-service identity fixture**

  `seed_e2e_identities.py` runs only when `SEED_E2E_USERS=true` and `ENVIRONMENT` is `local` or `test`. It reads Keycloak admin credentials from secret files, resolves the exact seeded usernames to subjects, and idempotently assigns the clinic-manager subject to one seeded clinic. It refuses production and emits no passwords/tokens. The Compose test proves admin/editor/publisher/manager/no-role assignments and a cross-clinic denial.

  ```bash
  ENVIRONMENT=test SEED_E2E_USERS=true docker compose run --rm keycloak-config
  ENVIRONMENT=test SEED_E2E_USERS=true docker compose run --rm --build api python scripts/seed_e2e_identities.py
  ENVIRONMENT=test SEED_E2E_USERS=true bash backend/tests/compose/test_e2e_fixtures.sh
  ```

- [ ] **Step 7: Verify auth behavior**

  Run:

  ```bash
  npm --prefix frontend run test -- --run tests/admin/auth.test.tsx tests/admin/admin-client.test.ts
  npm --prefix frontend run typecheck
  npm --prefix frontend exec -- antd lint src/admin --format json
  npm --prefix frontend run e2e -- --project=mock admin-auth.spec.ts
  ```

  Expected: public route has no login redirect; the mocked browser contract proves bare/deep `/admin` PKCE behavior and an authorized principal sees the shell. Task 22 repeats login against real realm `doncik` and the deterministic identities.

- [ ] **Step 8: Commit**

  ```bash
  git add backend frontend
  git commit -m "feat(admin): add keycloak protected administration shell"
  ```

## Task 16: Build reusable admin CRUD foundations and site/clinic/catalog screens

**Files:**

- Create: `frontend/src/admin/components/ResourceTable.tsx`, `ResourceDrawer.tsx`, `VersionConflictDialog.tsx`, `UnsavedChangesGuard.tsx`, `FieldErrorSummary.tsx`
- Create: `frontend/src/admin/components/ClinicScopePicker.tsx`, `PriceEditor.tsx`, `OrderedListEditor.tsx`, `RichTextEditor.tsx`
- Create: `frontend/src/admin/features/site/`, `clinics/`, `catalog/`, `offers/`
- Modify: `frontend/src/admin/AdminApp.tsx`, `frontend/src/admin/layout/AdminLayout.tsx`
- Test: `frontend/tests/admin/resource-table.test.tsx`, `frontend/tests/admin/site-clinic-catalog.test.tsx`

- [ ] **Step 1: Query the exact Ant Design APIs and write failing component tests**

  Run before implementation:

  ```bash
  npm --prefix frontend exec -- antd info Table --format json
  npm --prefix frontend exec -- antd info Form --format json
  npm --prefix frontend exec -- antd info Drawer --format json
  npm --prefix frontend exec -- antd info Modal --format json
  npm --prefix frontend exec -- antd info Select --format json
  npm --prefix frontend exec -- antd info InputNumber --format json
  ```

  Tests cover server paging/sorting/filtering, stable `rowKey="id"`, remote Select with local filtering disabled, loading/empty/error, create/edit/delete, ETag conflict, field/server errors, unsaved-close warning, ordered children, keyboard focus return, and permission-disabled actions.

- [ ] **Step 2: Implement shared CRUD mechanics without hiding domain forms**

  `ResourceTable` owns unified server query state and selection. `ResourceDrawer` owns lifecycle and accessible errors. Domain feature folders own their schemas/forms; do not create a metadata engine that accepts arbitrary field definitions or raw HTML.

- [ ] **Step 3: Implement site/page/navigation screens**

  Add site settings/links, menu tree/items, page list, page template/route/SEO editor, and typed section ordering/editor. Validate route and menu targets before save and surface publication warnings inline.

- [ ] **Step 4: Implement clinic/team screens**

  Add clinic details, contacts, weekly hours, transit, FAQs, doctor profiles, doctor-clinic assignment, and clinic-principal scope administration visible only to `dentnow_admin`.

- [ ] **Step 5: Implement catalog/offer screens**

  Add treatment categories, treatments, structured prices, FAQs, clinic availability, offers/features/validity, offer mappings, technologies, and partners. Price UI sends numeric/price-kind contracts rather than formatted strings.

- [ ] **Step 6: Verify admin slice**

  Run:

  ```bash
  npm --prefix frontend run test -- --run tests/admin/resource-table.test.tsx tests/admin/site-clinic-catalog.test.tsx
  npm --prefix frontend run typecheck
  npm --prefix frontend run lint
  npm --prefix frontend exec -- antd lint src/admin --format json
  ```

  Expected: tests and Ant Design lint pass with no broad internal-selector overrides.

- [ ] **Step 7: Commit**

  ```bash
  git add frontend
  git commit -m "feat(admin): manage site clinics catalog and offers"
  ```

## Task 17: Build editorial, legal, quiz, media, and audit administration

**Files:**

- Create: `frontend/src/admin/features/editorial/`, `legal/`, `quiz/`, `media/`, `audit/`
- Create: `frontend/src/admin/components/MediaPicker.tsx`, `MediaUpload.tsx`, `ConsentStatus.tsx`, `AuditDiff.tsx`
- Modify: `frontend/src/admin/AdminApp.tsx`, `frontend/src/admin/layout/AdminLayout.tsx`
- Test: `frontend/tests/admin/editorial-media.test.tsx`, `frontend/tests/admin/legal-quiz-audit.test.tsx`, `frontend/e2e/admin-crud.spec.ts`

- [ ] **Step 1: Query Upload/Image component APIs and write failing tests**

  ```bash
  npm --prefix frontend exec -- antd info Upload --format json
  npm --prefix frontend exec -- antd info Image --format json
  npm --prefix frontend exec -- antd info DatePicker --format json
  npm --prefix frontend exec -- antd info Tabs --format json
  npm --prefix frontend exec -- antd info Descriptions --format json
  ```

  Cover explicit controlled upload state, progress/failure/retry/cancel, alt/rights validation, media selection, de-identified before/after pairing, non-identifying publication attestation/expiry/revocation, delivery blocking, Markdown preview, exact review date/rating/source, legal approval controls, quiz band validation, and redacted audit diffs. No patient identity or consent-document upload control exists.

- [ ] **Step 2: Implement editorial screens**

  Add articles, news, reviews, case studies, and ebooks with safe Markdown editing, media picking, status/review metadata, and relevant nested relations. Do not expose a raw HTML editor.

- [ ] **Step 3: Implement legal and quiz screens**

  Add versioned GDPR/privacy/terms/cookie documents with effective date/approval, and quiz/question/option/result-band ordered editors with live score-range validation.

- [ ] **Step 4: Implement media and consent library**

  Add server-paginated grid/list, filters for kind/readiness/rights/alt/attestation, upload queue, metadata edit, variants preview, usage references, safe delete explanation, attestation status, opaque external evidence reference, expiry/revocation, and delivery-block controls. Browser uploads go only to the authenticated API; no consent evidence document or patient identifier is accepted. Only publisher/admin can approve or revoke an attestation.

- [ ] **Step 5: Implement audit explorer**

  Add actor/action/entity/time filters and a redacted before/after view. Audit is read-only and available only to admin/publisher as defined by backend policy.

- [ ] **Step 6: Verify all CRUD families end to end**

  Run:

  ```bash
  npm --prefix frontend run test -- --run tests/admin/editorial-media.test.tsx tests/admin/legal-quiz-audit.test.tsx
  npm --prefix frontend run typecheck
  npm --prefix frontend exec -- antd lint src/admin --format json
  npm --prefix frontend run e2e -- --project=mock admin-crud.spec.ts
  ```

  Expected: an authorized admin can create/read/update/delete every in-scope content family and receives meaningful conflicts/validation errors.

- [ ] **Step 7: Commit**

  ```bash
  git add frontend
  git commit -m "feat(admin): manage editorial legal quiz media and audit"
  ```

## Task 18: Add QTP-style `cmdk` rapid navigation and quick actions

**Files:**

- Create: `backend/src/site/search_service.py`, `backend/src/api/admin_search.py`
- Modify: `backend/maps/endpoint.json`
- Create: `frontend/src/admin/components/CommandPalette.tsx`, `frontend/src/admin/components/commandRegistry.tsx`
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`, `frontend/src/admin/AdminApp.tsx`, admin styles
- Test: `backend/tests/unit/test_admin_search.py`, `frontend/tests/admin/command-palette.test.tsx`, `frontend/e2e/admin-command-palette.spec.ts`

- [ ] **Step 1: Write failing permission-scoped search tests**

  Backend tests cover minimum two-character query, per-group result cap, stable ranking, resource type/ID/title/route result contract, clinic scope, role filtering, soft-deleted exclusion, and no sensitive/private consent payload.

- [ ] **Step 2: Implement `/api/v1/admin/search`**

  Search clinics, pages, treatments, offers, doctors, articles, news, reviews, ebooks, and media using indexed case-insensitive fields. Return only resources the principal may read. Keep the response small and versioned; no patient/registration search exists.

- [ ] **Step 3: Port the proven QTP interaction pattern**

  Implement:

  ```text
  Ctrl+K / Cmd+K global toggle
  header search trigger and custom open event
  query reset on open
  180 ms debounce
  remote search enabled at 2+ characters
  shouldFilter=false for mixed static/dynamic groups
  looped keyboard navigation and Escape close
  small cached result groups
  ```

  Use `Command.Dialog`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, and `Command.Empty` as in QTP.

- [ ] **Step 4: Register permission-aware commands**

  Groups include admin pages, create actions, quick views (unpublished, expired offers, missing alt/consent, review required), backend results, and safe actions (validate, refresh preview, open live site, theme, logout). Publish/rollback commands open a confirmation dialog; they never mutate immediately on selection.

- [ ] **Step 5: Test keyboard and search behavior**

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_admin_search.py -q
  npm --prefix frontend run test -- --run tests/admin/command-palette.test.tsx
  npm --prefix frontend run e2e -- --project=mock admin-command-palette.spec.ts
  ```

  Expected: full workflow works without a mouse, unauthorized commands/results are absent, and rapid typing does not send a request per keystroke.

- [ ] **Step 6: Commit**

  ```bash
  git add backend frontend
  git commit -m "feat(admin): add cmdk navigation and quick actions"
  ```

## Task 19: Add actual-renderer preview, validation, publish, and rollback UX

**Files:**

- Create: `frontend/src/public-site/PreviewApp.tsx`, `frontend/src/preview/main.tsx`, `frontend/src/preview/session.ts`, `frontend/src/preview/messages.ts`
- Create: `frontend/src/admin/features/publication/PublicationBar.tsx`, `PreviewPane.tsx`, `ValidationReport.tsx`, `PublicationHistory.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/admin/AdminApp.tsx`, `frontend/src/admin/layout/AdminLayout.tsx`
- Test: `frontend/tests/admin/publication.test.tsx`, `frontend/tests/public-site/preview.test.tsx`, `frontend/e2e/preview-publish-rollback.spec.ts`

- [ ] **Step 1: Write failing preview/publication tests**

  Cover one-use fragment exchange, fragment removal, HttpOnly-session contract, expiry/revocation, isolated origin, strict `postMessage` origins, iframe sandbox, same renderer contract, permission-scoped route selection, desktop/tablet/mobile widths, preview media, `noindex`/`no-store`, validation errors linked to editors, unpublished workspace indicator, publish role, confirmation, active version refresh, history, rollback consent-block revalidation, and restore-workspace separation.

- [ ] **Step 2: Implement preview route and pane**

  The distinct `PREVIEW_APP_URL` serves `/preview` with no Keycloak initialization or admin controls. The admin sets the one-use token only in the iframe URL fragment. `PreviewApp` exchanges it at the exact preview-session API, clears the fragment, and then uses only the host-only HttpOnly cookie. The admin embeds the frame with a restrictive sandbox; frame/admin communicate route and viewport changes only through exact-origin `postMessage`. Preview nginx denies non-preview API paths. Relevant saves create a new frozen preview rather than pretending unsaved form state is persisted.

- [ ] **Step 3: Implement publication controls**

  The persistent admin header shows active publication, workspace version, unpublished state, and last publisher/time. Validate presents all errors/warnings. Publish and rollback require explicit confirmation and permission. After activation, invalidate public/admin query caches and verify the reported active hash/version.

- [ ] **Step 4: Verify end-to-end**

  Run:

  ```bash
  npm --prefix frontend run test -- --run tests/admin/publication.test.tsx tests/public-site/preview.test.tsx
  npm --prefix frontend run e2e -- --project=mock preview-publish-rollback.spec.ts
  ```

  Expected: a draft edit appears in preview but not public, publish switches the full site, and rollback restores the previous full snapshot/media set.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend
  git commit -m "feat(admin): preview publish and roll back site releases"
  ```

## Task 20: Build production images and complete the one-command Compose stack

**Files:**

- Modify: `backend/Dockerfile`, `backend/.dockerignore`
- Modify: `frontend/Dockerfile`
- Create: `frontend/nginx/default.conf.template`, `frontend/nginx/preview.conf.template`, `frontend/docker-entrypoint.d/40-runtime-config.sh`, `deploy/caddy/Caddyfile`
- Modify: `docker-compose.yml`, `.env.example`, `.gitignore`, `frontend/.dockerignore`, `Makefile`, `ops/init-secrets.sh`
- Test: `backend/tests/compose/test_stack.sh`, `frontend/scripts/smoke-check.mjs`

- [ ] **Step 1: Write a failing full-stack smoke test**

  From a browser/client perspective verify:

  ```text
  GET / -> 200 SPA
  GET /tratamente -> 200 SPA fallback
  GET /api/health -> 200 with build revision
  GET /api/v1/public/bootstrap -> 200 without auth
  GET /sitemap.xml -> XML from active publication
  GET /admin -> 200 SPA then Keycloak login in browser test
  GET /api/v1/admin/me -> 401 without token
  GET preview-origin/preview -> SPA; preview API -> 401 without session
  representative published media -> 200 and cache headers
  ```

- [ ] **Step 2: Build the backend image**

  Use a Python 3.12 multi-stage image. Verify/install `backend/dist/qf-1.0.5-py3-none-any.whl` plus hash-locked runtime requirements, copy backend runtime files and the packaged `backend/seeds/assets` bundle required by the one-shot seed, run as a non-root user, and start `gunicorn -c gunicorn.conf.py wsgi:app`. Add OCI source/revision/version labels and a process health check. The image neither reads a frontend context nor needs a source checkout at runtime.

- [ ] **Step 3: Build the frontend image and nginx gateway**

  Use Node 20 for `npm ci`/build and nginx Alpine for runtime. nginx must:

  - proxy `/api/` to `${API_UPSTREAM}` without stripping `/api`;
  - proxy exact `/sitemap.xml` to the public sitemap API;
  - serve `robots.txt`, `/config.json`, and the SPA;
  - use `try_files $uri $uri/ /index.html` for browser routes;
  - never cache `config.json` or `index.html`;
  - cache fingerprinted assets immutably;
  - allow bounded admin media uploads;
  - preserve correlation/forwarded headers and proxy timeouts;
  - apply security headers without blocking the explicitly configured isolated preview or approved Google Maps frames.

  The entrypoint uses `jq -n --arg` (or an equivalently real JSON serializer) to atomically generate `config.json`; tests include quotes, newlines, Unicode separators, and `</script>`. It never creates executable JavaScript and never receives secrets.

  Run the same built renderer as a separate `preview` nginx service/origin. That server exposes `/preview`, proxies only `/api/v1/preview/*`, strips raw URI/referrer logging, sets its restrictive CSP/frame-ancestors policy, and denies public/admin API namespaces.

- [ ] **Step 4: Complete all Compose application services**

  Add `migrate`, `seed`, `api`, `frontend`, `preview`, and the optional production `edge` to the data/identity services. Required order is:

  ```text
  postgres/minio/keycloak healthy
    -> minio-init/keycloak-config complete
    -> migrate complete
    -> seed complete
    -> api healthy
    -> frontend/preview healthy
    -> edge healthy (production profile)
  ```

  `migrate` and `seed` use the exact backend image/build. The production Caddy edge terminates TLS and routes exact public/admin, preview, and Keycloak hosts; an explicitly configured existing trusted edge may replace it. Set restart policies for long-lived services, stop grace periods, read-only root filesystem/tmpfs where compatible, named volumes, internal network aliases, log rotation, and resource limits.

  Do not set `container_name`; Compose project names must isolate normal deployments, CI, and destructive clean-volume rehearsals.

- [ ] **Step 5: Remove tracked environment content and enforce secret boundaries**

  Add `.env` and `.secrets/` patterns to `.gitignore`. Verify the old tracked `.env` was audited, moved, and its migration-only copy deleted in Task 13; clinic values now originate in `backend/seeds/current-site.json`. `.env.example` contains only non-secret coordinates. `ops/init-secrets.sh` creates PostgreSQL/MinIO/Keycloak secret files; production startup refuses defaults, HTTP origins, wildcard CORS, exposed data ports, seeded users, or Keycloak dev mode. Run full-history and final-image secret scans and rotate any detected credential.

- [ ] **Step 6: Verify clean-volume bootstrap and persistence**

  Run:

  ```bash
  ENVIRONMENT=test ALLOW_DESTRUCTIVE_TESTS=1 docker compose -p dentnow-rehearsal down -v --remove-orphans
  docker compose -p dentnow-rehearsal config --quiet
  docker compose -p dentnow-rehearsal up --build -d
  docker compose -p dentnow-rehearsal ps
  COMPOSE_PROJECT_NAME=dentnow-rehearsal bash backend/tests/compose/test_stack.sh
  docker compose -p dentnow-rehearsal restart postgres minio keycloak api frontend
  COMPOSE_PROJECT_NAME=dentnow-rehearsal bash backend/tests/compose/test_stack.sh
  ENVIRONMENT=test ALLOW_DESTRUCTIVE_TESTS=1 docker compose -p dentnow-rehearsal down -v --remove-orphans
  ```

  Expected: one command reaches healthy application state, one-shot services exit `0`, smoke passes before and after restart, and the active publication/media/admin identity persist. The destructive helper refuses production and any project name not matching the disposable rehearsal pattern. A production-profile smoke additionally proves HTTPS, strict Keycloak issuer/backchannel behavior, preview-origin isolation, and that only the edge ports are published.

- [ ] **Step 7: Commit**

  ```bash
  git add backend frontend deploy docker-compose.yml .env.example .gitignore Makefile ops/init-secrets.sh
  git commit -m "feat(deploy): deliver complete docker compose stack"
  ```

## Task 21: Add SEO delivery, security hardening, observability, and recovery tools

**Files:**

- Create: `backend/src/core/metrics.py`, `backend/src/core/security.py`, `backend/src/core/redaction.py`
- Create: `ops/backup-compose.sh`, `ops/restore-compose.sh`, `ops/verify-backup.sh`, `ops/minio_versions.py`, `ops/pre_migrate_backup.sh`
- Modify: `backend/wsgi.py`, `backend/src/site/publication_service.py`, `frontend/nginx/default.conf.template`, `frontend/nginx/preview.conf.template`, `frontend/public/robots.txt`
- Test: `backend/tests/unit/test_redaction.py`, `backend/tests/unit/test_safe_structured_data.py`, `backend/tests/contract/test_security_headers.py`, `backend/tests/integration/test_sitemap.py`, `backend/tests/compose/test_backup_restore.sh`

- [ ] **Step 1: Write failing security/SEO/recovery tests**

  Cover public/admin/isolated-preview CSP and headers, admin/preview no-store, public ETag/cache, consent-bound short cache/`410`, sitemap paths/XML escaping, typed/escaped JSON-LD, URL-scheme allowlists, robots location, no raw URI/query/referrer/token/credential/patient/PII in application or proxy logs/audit, audit DB immutability, upload/body limits, generic external readiness, correlation IDs, bounded log rotation, metrics labels without high-cardinality paths, both PostgreSQL databases/globals, every MinIO object version/delete marker, encrypted off-host archive hooks, and restore into empty volumes.

- [ ] **Step 2: Complete publication-driven SEO**

  Generate sitemap, canonical paths, navigation-visible routes, article routes, and structured-data facts exclusively from the active publication. Build JSON-LD from typed schemas and insert safely serialized text with `<`, U+2028, and U+2029 escaping; never accept stored raw JSON-LD. `robots.txt` points to same-origin `/sitemap.xml`; admin/preview paths are disallowed/noindexed.

- [ ] **Step 3: Add security middleware and headers**

  Configure separate public/admin and preview CSPs, exact `frame-ancestors`, MIME sniff protection, `Referrer-Policy: no-referrer` for admin/preview, permissions policy, production HSTS, safe media dispositions, URL-scheme allowlists, request/upload limits, and schema-specific redaction. Audit stores no raw IP/UA and application DB grants/triggers forbid update/delete. Do not restore the obsolete whole-host oauth2-proxy annotations or place auth in front of public paths.

- [ ] **Step 4: Add logs, metrics, and optional traces**

  Emit structured method-template/status/duration/correlation/release/pseudonymous-actor logs without raw URIs, queries, referrers, bodies, or credentials. Set application/proxy log rotation and disk-capacity alerts. Expose internal-only Prometheus counters/histograms for requests, publications, validation, uploads, DB/MinIO health, disk capacity, and outbox backlog. Wire optional qf/OpenTelemetry export through environment values without preview/auth attributes.

- [ ] **Step 5: Add Compose backup/restore tools**

  Acquire the maintenance/advisory lock so backup cannot race publication, media mutation, or GC. Create timestamped PostgreSQL roles/globals plus separate custom-format dumps for `dentnow` and `keycloak`. `minio_versions.py` uses S3 `list_object_versions`/versioned reads to capture every byte version, metadata record, and delete marker; a plain `mc mirror` is forbidden. Encrypt/sign the archive and invoke a configured off-host copy hook. Record only secret-version references; a separately encrypted escrow bundle or tested restore-time identity rotation recreates matching PostgreSQL/MinIO/Keycloak service credentials. Restore requires explicit empty-target confirmation, reconstructs versions chronologically, and verifies checksums plus Keycloak login/roles, DentNow scopes, publications, audit/outbox, and delivery blocks. Document/alert against clinic-approved RPO/RTO.

  `pre_migrate_backup.sh` obtains the migration lock, verifies free disk headroom, takes/verifies a backup before nontrivial production migrations, and refuses concurrent migration/GC/restore. Add a quarterly secret-rotation and restore rehearsal.

- [ ] **Step 6: Verify hardening and recovery**

  Run:

  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/unit/test_redaction.py backend/tests/unit/test_safe_structured_data.py backend/tests/contract/test_security_headers.py backend/tests/integration/test_sitemap.py -q
  bash backend/tests/compose/test_backup_restore.sh
  ```

  Expected: security/SEO tests pass and a clean-volume restore reproduces login/roles/scopes, active and older publications, audit/outbox, delivery blocks, representative media versions, and delete markers.

- [ ] **Step 7: Commit**

  ```bash
  git add backend frontend ops
  git commit -m "feat(platform): harden observe and back up dentnow"
  ```

## Task 22: Complete the cross-stack automated test matrix

**Files:**

- Expand: `backend/tests/{unit,integration,contract,architecture,compose}/`
- Expand: `frontend/tests/`, `frontend/e2e/`
- Modify: `frontend/playwright.config.ts`, `frontend/tests/msw/handlers.ts`, backend/frontend test configuration, and `Makefile`

- [ ] **Step 1: Add missing backend coverage**

  Ensure unit/integration/contract suites cover every role/resource family, clinic-scoped get/list/search/nested relations, invalid/stale writes, sanitization, publication/rollback/restore semantics, consent delivery blocks, MinIO/GC, migrations, audit query/immutability, outbox, public anonymity, every-method admin default denial, wrong `azp`, error envelopes, and dependency rules. Enforce a meaningful coverage floor on domain/application modules, excluding generated migrations.

- [ ] **Step 2: Add missing frontend coverage**

  Cover every public template, admin navigation/form/resource family, media, permission state, conflicts, `cmdk`, preview/publish, loading/error/empty, reduced motion, keyboard interaction, and responsive critical routes.

- [ ] **Step 3: Add deterministic fixtures and full real-service Playwright journeys**

  Start a disposable Compose project with `SEED_E2E_USERS=true`, run `keycloak-config`, seed the site, then run `backend/scripts/seed_e2e_identities.py` to resolve subjects and assign the manager to exactly one clinic. Assert fixture roles/scopes before launching Playwright's existing `compose` project; never reuse production identity or volumes.

  At minimum:

  1. anonymous visitor traverses every route without login;
  2. `/admin` logs into realm `doncik` and restores deep link;
  3. admin edits clinic/treatment/offer/article/legal/quiz data;
  4. admin uploads media and completes rights/alt metadata; publisher approves a de-identified case-image attestation and revocation produces `410` even after rollback;
  5. draft is absent publicly, visible in preview, then visible after publish;
  6. rollback restores the previous publication;
  7. clinic manager is denied another clinic through get, list, search, and nested mappings;
  8. command palette navigates, searches, opens a create flow, validates, and logs out;
  9. no patient/offer-registration submission endpoint exists.

- [ ] **Step 4: Create root verification targets**

  `Makefile` exposes `frontend-check`, `backend-check`, `compose-up`, `compose-smoke`, `e2e`, `backup-test`, and `check` (all required checks).

- [ ] **Step 5: Run the full matrix**

  ```bash
  make check
  ```

  Expected: frontend lint/type/test/build, backend lint/type/unit/integration/contract/migration, Compose smoke, and Playwright all pass.

- [ ] **Step 6: Commit**

  ```bash
  git add backend frontend Makefile
  git commit -m "test: cover public admin media and publication flows"
  ```

## Task 23: Replace GitHub CI with paired frontend/backend pipelines

**Files:**

- Create: `.github/workflows/ci.yml`
- Replace: `.github/workflows/docker-publish.yml`
- Modify: `backend/.dockerignore`, `frontend/.dockerignore`, `README.md`

- [ ] **Step 1: Add pull-request checks**

  `ci.yml` runs frontend and backend checks in parallel, verifies qf/requirements hashes, then a Compose integration job that builds the pair, starts disposable clean volumes with deterministic identities, runs migrations/seed/smoke/real-service Playwright, and uploads redacted logs/reports on failure. Cache npm and pip/build layers by their respective lock/manifests. Full-history secret scanning runs on the first adoption and diff/image-layer secret scans run on every change.

- [ ] **Step 2: Publish two immutable images only after checks**

  On `main`/`master`, publish:

  ```text
  bogdancstrike/dentnow-frontend:<branch>-<short-sha>
  bogdancstrike/dentnow-backend:<branch>-<short-sha>
  ```

  Also update moving `branch`/`latest` tags if desired, but Compose release examples must use the immutable paired SHA tag. Both images carry the same OCI revision label.

- [ ] **Step 3: Add image and migration safety checks**

  Build from `frontend/Dockerfile` and `backend/Dockerfile` with separate cache scopes. Run container vulnerability and image-layer secret scanning, verify non-root backend execution, verify JSON runtime config contains no secret/executable injection, and refuse publish when wheel/requirements hashes, Alembic, clean-volume bootstrap, production-profile policy, or restore smoke fails.

- [ ] **Step 4: Validate workflow syntax and local equivalents**

  Run:

  ```bash
  docker build -f backend/Dockerfile -t dentnow-backend:test backend
  docker build -f frontend/Dockerfile -t dentnow-frontend:test frontend
  docker compose config --quiet
  make check
  ```

  Expected: both images build independently and the tested pair passes the full local equivalent of CI.

- [ ] **Step 5: Commit**

  ```bash
  git add .github backend/.dockerignore frontend/.dockerignore README.md
  git commit -m "ci: test and publish paired dentnow images"
  ```

## Task 24: Finish operational documentation and perform release rehearsal

**Files:**

- Rewrite: `README.md`
- Modify: `docs/architecture.md`, `docs/implementation_plan.md`
- Create: `docs/content_operations.md`, `docs/deployment_runbook.md`, `docs/recovery_runbook.md`, `docs/future_integrations.md`

- [ ] **Step 1: Document the exact operator path**

  README must cover prerequisites, repository layout, non-secret `.env` coordinates, `ops/init-secrets.sh`, local versus production/TLS-edge profiles, `docker compose up --build -d`, initial Keycloak admin/role assignment in realm `doncik`, public/admin/isolated-preview URLs, generic versus internal health, logs, backup-before-migration, seed/baseline behavior, shutdown, upgrade with paired images, secret rotation, and common failures.

- [ ] **Step 2: Document clinic content operations**

  Cover each CRUD area, media rights/alt/non-identifying attestation and revocation blocks, preview isolation, validation, publish, rollback versus restore-workspace, audit, command palette shortcuts/actions, content review flags, and the fact that save does not publish. State the production legal/privacy gates for patient-derived case imagery and that DentNow stores no identity/consent document.

- [ ] **Step 3: Document recovery and future integration boundaries**

  Include tested encrypted/off-host backup/restore commands for PostgreSQL globals/both databases and all MinIO versions/delete markers, maintenance locking, RPO/RTO, restore rehearsal, GC coordination, and login/scope verification. Explain the outbox/adapter/external-ID contract and the separate schema/credentials/keys/roles required for future patient/offer registration, consent, encrypted PII, retention, egress, and clinical-data risk.

- [ ] **Step 4: Run a clean release rehearsal**

  On disposable volumes:

  ```bash
  ENVIRONMENT=test ALLOW_DESTRUCTIVE_TESTS=1 docker compose -p dentnow-release-rehearsal down -v --remove-orphans
  ./ops/init-secrets.sh
  docker compose -p dentnow-release-rehearsal up --build -d
  COMPOSE_PROJECT_NAME=dentnow-release-rehearsal make compose-smoke
  COMPOSE_PROJECT_NAME=dentnow-release-rehearsal make e2e
  COMPOSE_PROJECT_NAME=dentnow-release-rehearsal make backup-test
  ENVIRONMENT=test ALLOW_DESTRUCTIVE_TESTS=1 docker compose -p dentnow-release-rehearsal down -v --remove-orphans
  ```

  Manually verify the literal public desktop/mobile route inventory, bare/deep `/admin` Keycloak login, each admin navigation group, `Cmd/Ctrl+K`, media upload, isolated preview, publish, anonymous post-publish access, consent revocation surviving rollback, restart persistence, and logout. Repeat policy/HTTPS checks with the production profile; destructive helpers must refuse that profile.

- [ ] **Step 5: Run the final source-of-truth checks**

  ```bash
  rg -n "0720 509 802|0723 232 263|Râmnicu Vâlcea|1\.490 lei|src/data" frontend/src
  rg -n "patient|medical_history|offer_registration" backend/src/api backend/maps/endpoint.json
  git status --short
  ```

  Expected: the first search finds no business-content fallback in runtime code; the second finds no enabled patient/registration endpoint; only intentional implementation changes are present.

- [ ] **Step 6: Commit**

  ```bash
  git add README.md docs
  git commit -m "docs: add dentnow operations and deployment runbooks"
  ```

## Final acceptance gate

- [ ] Root contains organized `backend/`, `frontend/`, `docs/`, `keycloak/`, `ops/`, Compose, README, Makefile, environment example, and CI; component build files are not scattered at root.
- [ ] After generated secret files and hostnames are supplied, `docker compose up --build -d` on clean volumes reaches healthy state without manual schema/bucket/client setup; the production profile supplies/tests TLS edge routing.
- [ ] All normal public routes and published media are anonymous; only bare `/admin` and `/admin/*` initiate Keycloak realm `doncik` login. Preview is possession-session gated without OAuth.
- [ ] Every `/api/v1/admin/*` read and write verifies JWT signature/issuer/audience/`azp`, explicit capability, and clinic scope under a route-map default-deny test.
- [ ] Every current content source and media reference is represented in PostgreSQL/MinIO and parity checks pass.
- [ ] Frontend runtime contains no clinic/business fallback data and displays explicit API error states.
- [ ] Admin manages all website CRUD families, media, legal/GDPR, SEO/navigation, quiz, audit, and publication history.
- [ ] Preview uses the actual public renderer on an isolated origin with one-use fragment exchange, HttpOnly session, sandbox, no credential logs, and distinct save/preview/publish/rollback/restore behavior.
- [ ] `Cmd/Ctrl+K` `cmdk` navigation, permission-scoped search, quick views, and safe quick actions pass keyboard/e2e tests.
- [ ] Structured authoring data is normalized in PostgreSQL; publication snapshots are immutable; media bytes are private in MinIO.
- [ ] No public contact/patient/offer-registration data or consent-document bytes are collected. De-identified patient-derived media passes the approved privacy/attestation/revocation gate. Integration events/outbox/ports are versioned and vendor-neutral for future work.
- [ ] Safe rich text, typed/safely serialized JSON-LD and runtime config, stored-XSS defenses, media delivery blocks, audit minimization/immutability, security headers, version-aware encrypted off-host backup/restore, and observability checks pass.
- [ ] Backend/frontend images share an immutable Git revision and pass paired Compose integration before publication.
- [ ] The homelab k3s migration remains documented but is not required to deploy this release.
