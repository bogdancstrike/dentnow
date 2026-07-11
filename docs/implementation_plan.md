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
│   ├── seeds/current-site.json
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
│   └── tests/{unit,integration,contract}/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── nginx/default.conf.template
│   ├── public/config.template.js
│   ├── scripts/
│   ├── src/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── public-site/
│   │   └── shared/
│   └── tests/
├── keycloak/
│   ├── configure-dentnow.sh
│   └── realm-local.json
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
- Move: `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `eslint.config.js`, `nginx.conf`, `Dockerfile` → `frontend/`
- Modify: `.gitignore`, `.dockerignore`, `README.md`, `.github/workflows/docker-publish.yml`
- Test: existing frontend build/lint/smoke commands from `frontend/`

- [ ] **Step 1: Record a non-mutating baseline**

  Run:

  ```bash
  git status --short
  npm ci
  npm run lint
  npx vite build --outDir /tmp/dentnow-baseline
  ```

  Expected: dependency installation succeeds; lint/build results are recorded before paths move. The temporary build does not rewrite `public/sitemap.xml`.

- [ ] **Step 2: Move frontend-owned files without redesigning them**

  Use `git mv` for tracked paths. Keep `.github/`, `docs/`, `.gitignore`, orchestration files, and the root `README.md` at repository root. Rename `frontend/vite.config.js` to `frontend/vite.config.ts` only after Task 2 introduces TypeScript.

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
- Create: `frontend/public/config.template.js`
- Create: `frontend/src/config/runtime.ts`
- Create: `frontend/src/api/http.ts`, `frontend/src/api/contracts.ts`
- Create: `frontend/src/public-site/PublicApp.tsx`
- Modify/rename: `frontend/src/main.jsx` → `frontend/src/main.tsx`, `frontend/src/App.jsx` → `frontend/src/App.tsx`
- Create: `frontend/vitest.config.ts`, `frontend/tests/setup.ts`, `frontend/tests/runtime-config.test.ts`

- [ ] **Step 1: Write the runtime-config tests**

  Cover relative API base, explicit Keycloak coordinates, and failure when a required admin coordinate is missing on `/admin`. Verify public startup needs only `apiBase` and does not initialize Keycloak.

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
  @playwright/test, @testing-library/jest-dom, @testing-library/react,
  @testing-library/user-event, @types/dompurify, @types/react,
  @types/react-dom, jsdom, msw, typescript, vitest
  ```

  Add scripts `typecheck`, `test`, `test:coverage`, and `e2e` while preserving `dev`, `build`, `lint`, and `smoke`.

- [ ] **Step 3: Implement runtime config with no content defaults**

  The public shape is:

  ```ts
  export interface DentNowRuntimeConfig {
    apiBase: string;
    keycloakUrl?: string;
    keycloakRealm?: "doncik";
    keycloakClientId?: "dentnow-admin-spa";
    buildRevision?: string;
  }
  ```

  Read `window.__DENTNOW__`, normalize trailing slashes, and validate admin fields only when the admin bundle is requested. Do not add phones, addresses, social links, or other business fallbacks.

- [ ] **Step 4: Split public and admin entry decisions**

  `App.tsx` renders `PublicApp` for normal/preview routes and lazy-loads `admin/AdminApp` only for `/admin/*`. Task 2 may use a temporary access-denied placeholder for the not-yet-created admin module, but it must not call Keycloak from public startup.

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
  sha256sum backend/dist/qf-1.0.5-py3-none-any.whl
  ```

  Commit the checksum to `backend/dist/SHA256SUMS`. Imports must use `framework`, not `qf`.

- [ ] **Step 2: Write failing qf contract tests**

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

  Apply gevent and psycogreen patches before socket/SSL/database imports, following `testing_platform/backend/wsgi.py`. No scheduler or worker is spawned.

- [ ] **Step 4: Add health handlers and a strict endpoint map**

  Use namespace `api`. Health and liveness return process/build identity; readiness initially returns `503` until database/storage adapters exist, then Task 6 completes it.

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

- Create: `docker-compose.yml`, `.env.example`, `Makefile`
- Create: `backend/docker/postgres/01-create-keycloak.sh`
- Create: `backend/docker/minio/dentnow-policy.json`, `backend/docker/minio/init.sh`
- Create: `keycloak/configure-dentnow.sh`, `keycloak/realm-local.json`
- Modify: `.gitignore`
- Test: `backend/tests/compose/test_infrastructure.sh`

- [ ] **Step 1: Write the infrastructure smoke script**

  It must verify PostgreSQL accepts `SELECT 1`, bucket `dentnow-media` exists with versioning, application MinIO credentials cannot list another bucket, realm `doncik` is discoverable, and both DentNow clients/roles exist.

- [ ] **Step 2: Define persistent services and health checks**

  Pin PostgreSQL 18, the same MinIO/`mc` releases used by the inspected homelab chart, and Keycloak 26.x. Create named volumes `postgres-data`, `minio-data`, and `keycloak-data`. Keep PostgreSQL and S3 internal by default; expose Keycloak and frontend browser ports.

- [ ] **Step 3: Create isolated databases and identities**

  PostgreSQL initializes database/user `dentnow` for the API and database/user `keycloak` for Keycloak. Credentials come from `.env`. The shell script uses fixed SQL identifiers and psql variables for password values; it never interpolates an arbitrary identifier.

- [ ] **Step 4: Bootstrap private MinIO storage idempotently**

  `minio-init` must:

  ```text
  create dentnow-media if absent
  enable bucket versioning
  create/update policy dentnow-media-rw restricted to that bucket
  create/update the DentNow application user
  attach only dentnow-media-rw
  ```

  Root MinIO credentials are used only by the one-shot init container. The API receives only application credentials.

- [ ] **Step 5: Bootstrap realm `doncik` idempotently**

  `configure-dentnow.sh` waits for Keycloak, signs in with `kcadm.sh`, creates realm `doncik` only when absent, and upserts:

  - public PKCE client `dentnow-admin-spa`;
  - bearer audience `dentnow-api`;
  - access-token audience mapper;
  - realm roles `dentnow_admin`, `dentnow_editor`, `dentnow_publisher`, `dentnow_clinic_manager`;
  - the local development admin only when `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` are set.

  Redirect URIs and web origins come from `PUBLIC_APP_URL`; direct access grants and implicit flow remain disabled.

- [ ] **Step 6: Validate Compose infrastructure**

  Run:

  ```bash
  cp .env.example .env
  docker compose config --quiet
  docker compose up -d postgres minio keycloak
  docker compose run --rm minio-init
  docker compose run --rm keycloak-config
  bash backend/tests/compose/test_infrastructure.sh
  ```

  Expected: all probes pass. Repeat both init services and expect success with no duplicate resources.

- [ ] **Step 7: Commit**

  ```bash
  git add docker-compose.yml .env.example Makefile backend/docker keycloak .gitignore
  git commit -m "feat(compose): provision postgres minio and keycloak"
  ```
