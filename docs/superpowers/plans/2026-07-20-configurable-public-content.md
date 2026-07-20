# Configurable Public Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove compiled DentNow business content from the public React bundle, render published Admin data across every public page, and fix the treatment-detail and responsive navigation/gallery presentation.

**Architecture:** The public API remains the only business-content boundary. Structured collections (clinics, treatments, technologies, e-books, navigation, links, doctors, offers, reviews, and gallery records) use their existing resource tables; page copy and SEO use Admin-managed site text/page records. React components keep only presentation logic and generic interface states, with no clinic-count, contact, price, schedule, or editorial fallbacks.

**Tech Stack:** React 18, React Router, TanStack Query, TypeScript/Zod, Flask/SQLAlchemy/Alembic, Ant Design Admin, Vitest/Testing Library, Playwright.

---

### Task 1: Fix the requested visual regressions

**Files:**
- Modify: `frontend/src/pages/TreatmentDetail.jsx`
- Modify: `frontend/src/pages/TreatmentDetail.css`
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/sections/Sections.css`
- Test: `frontend/tests/public-site/treatment-detail.test.tsx`
- Test: `frontend/tests/public-site/navbar.test.tsx`

- [ ] Add a treatment-detail regression test that renders a treatment without summary/detail content and asserts that the page still shows one useful intro, the formatted Admin price, and working contact actions without an empty overview box.
- [ ] Add a mobile-navigation regression test that asserts the treatment section contains only the treatment index and emergency link, while clinic and resource links remain available.
- [ ] Replace the empty/raw detail layout with a compact editorial treatment header, a resilient content fallback, a sticky price/booking panel, and mobile-safe spacing.
- [ ] Make `.gallery-thumb` explicitly white in light mode and use the raised dark surface in dark mode.
- [ ] Run `npm test -- --run tests/public-site/treatment-detail.test.tsx tests/public-site/navbar.test.tsx` and `npm run build`; expect both commands to pass.
- [ ] Commit and push the checkpoint.

### Task 2: Make public navigation, links, and structured SEO dynamic

**Files:**
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/layout/Footer.jsx`
- Modify: `frontend/src/components/seo/Seo.jsx`
- Modify: `frontend/src/lib/leadCapture.js`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/Recenzii.jsx`
- Modify: `frontend/src/pages/RecenzieRedirect.jsx`
- Modify: `frontend/src/pages/LocationPage.jsx`
- Modify: `frontend/src/pages/UrgenteDentare.jsx`
- Test: `frontend/tests/public-site/navigation-content.test.tsx`
- Test: `frontend/tests/public-site/seo.test.tsx`

- [ ] Test that desktop/mobile menus render `bootstrap.navigation`, contact/social/review URLs render `bootstrap.links`, and JSON-LD clinic count follows `bootstrap.clinics`.
- [ ] Introduce small selectors for links and navigation items so components share one interpretation of the public contract.
- [ ] Remove imports of `src/config.js` and `src/data/navigation.js` from public components.
- [ ] Build organization/clinic JSON-LD from configured site, link, clinic, coordinate, hours, and contact records.
- [ ] Run the focused public-site tests and `npm run typecheck`; expect both to pass.
- [ ] Commit and push the checkpoint.

### Task 3: Publish existing Admin resources that the frontend still ignores

**Files:**
- Modify: `backend/src/api/public_content.py`
- Modify: `frontend/src/api/publicContracts.ts`
- Modify: `frontend/src/public-site/SiteDataProvider.tsx`
- Modify: `frontend/src/components/sections/TechnologySection.jsx`
- Modify: `frontend/src/pages/Ebook.jsx`
- Modify: `frontend/src/admin/layout/adminNavigation.ts`
- Modify: `frontend/src/admin/features/registry.tsx`
- Test: `backend/tests/integration/test_public_content.py`
- Test: `frontend/tests/public-site/configurable-collections.test.tsx`

- [ ] Add failing API contract tests for active, ordered `technologies` and `ebooks` in `/v1/public/bootstrap`.
- [ ] Serialize those existing SQLAlchemy resources into the bootstrap response and Zod contract, including media identifiers.
- [ ] Register Technology and E-book CRUD screens in Admin with upload, ordering, active-state, and preview fields.
- [ ] Remove the `clinicProof.js` technology list and `content.js` e-book fallback from public rendering.
- [ ] Run backend public-content tests plus frontend contract/component tests; expect all to pass.
- [ ] Commit and push the checkpoint.

### Task 4: Move page copy and SEO defaults out of the frontend bundle

**Files:**
- Create: `backend/seeds/site-texts.json`
- Create: `backend/migrations/versions/0019_seed_public_site_texts.py`
- Modify: `backend/scripts/seed_current_site.py`
- Modify: `frontend/src/data/siteTextRegistry.js`
- Modify: `frontend/src/hooks/useSiteTexts.js`
- Modify: `frontend/src/admin/features/site-texts/SiteTextsScreen.tsx`
- Modify: all public page/component renderers under `frontend/src/pages` and `frontend/src/components`
- Test: `backend/tests/unit/test_seed_fixture_contract.py`
- Test: `frontend/tests/public-site/site-texts.test.tsx`

- [ ] Inventory every patient-visible business string and assign a stable page-scoped key; keep only Admin labels and field metadata in the frontend registry.
- [ ] Store the current Romanian values in the backend seed fixture and add an idempotent data migration for existing databases.
- [ ] Change Site Texts from optional overrides with compiled defaults to required Admin-owned values; missing values render an explicit content gap in development and an empty optional section in production.
- [ ] Replace hardcoded page hero, SEO, CTA, notice, empty-state, and descriptive copy with `t(key)` calls while leaving generic accessibility/control words in code only where they are not business content.
- [ ] Delete compiled business-content modules after `rg` confirms they have no public consumers.
- [ ] Run frontend tests, backend tests, typecheck, lint, and build; expect all to pass.
- [ ] Commit and push the checkpoint.

### Task 5: Add an Admin page-content editor for structured page sections

**Files:**
- Create: `frontend/src/admin/features/pages/PagesScreen.tsx`
- Create: `frontend/src/admin/features/pages/PageEditorScreen.tsx`
- Create: `frontend/src/admin/features/pages/PageSectionEditor.tsx`
- Modify: `frontend/src/admin/layout/adminNavigation.ts`
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`
- Modify: `frontend/src/api/publicClient.ts`
- Create: `frontend/src/hooks/usePublicPage.ts`
- Test: `frontend/tests/admin/pages-editor.test.tsx`
- Test: `frontend/tests/public-site/page-content.test.tsx`

- [ ] Test page metadata, SEO, section ordering, payload editing, and public preview behavior.
- [ ] Add a Pages Admin area backed by `/v1/admin/pages`, `/v1/admin/page-sections`, and `/v1/admin/page-seo`, using block-specific forms instead of raw JSON for supported public sections.
- [ ] Add a shared public-page query hook and helpers for selecting section payloads by block type.
- [ ] Render home journey and page-specific structured groups from published sections, with no compiled array fallback.
- [ ] Run Admin and public page tests, then the full frontend suite; expect all to pass.
- [ ] Commit and push the checkpoint.

### Task 6: Enforce the no-hardcoded-content boundary

**Files:**
- Create: `frontend/scripts/check-public-content-boundary.mjs`
- Modify: `frontend/package.json`
- Modify: `frontend/e2e/live-smoke.spec.ts`
- Modify: `README.md`

- [ ] Add a static check that rejects imports of retired compiled content/config modules from public pages and rejects known clinic/contact literals outside test fixtures.
- [ ] Add responsive smoke coverage for every route, mobile menu contents, treatment detail with sparse content, dynamic clinic cardinality, and light/dark gallery thumbnails.
- [ ] Document which Admin module owns each public content family and the publish/preview workflow.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`, backend `pytest`, and the public-content boundary check; expect all to pass.
- [ ] Commit, push, and open a draft pull request with the audit findings and validation summary.
