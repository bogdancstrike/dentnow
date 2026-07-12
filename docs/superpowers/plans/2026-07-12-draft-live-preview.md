# Draft Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render unsaved admin form values in the real public pages without persisting them, complete nested quiz editing, remove the unused site-settings page, and replace technical “Slug” labels throughout the admin UI.

**Architecture:** The admin iframe sends an in-memory draft over a same-origin `postMessage` channel. Public renderers overlay that draft on API data only while `?preview=1` is present; leaving the editor destroys the iframe and draft. Existing create/update APIs remain the only persistence path. Quiz child records continue to use their existing CRUD endpoints and are edited only after the parent quiz has an ID.

**Tech Stack:** React 18, TypeScript, Ant Design 6, TanStack Query, React Router, Vitest/Testing Library, Flask/qf API.

---

### Task 1: Harden and test the browser-only draft channel

**Files:**
- Modify: `frontend/src/api/previewDraft.ts`
- Modify: `frontend/src/admin/components/LivePreview.tsx`
- Modify: `frontend/tests/admin/live-preview.test.tsx`
- Create: `frontend/tests/api/preview-draft.test.tsx`

- [ ] **Step 1: Add failing transport tests**

Test that a draft makes the iframe visible before save, that the current draft is sent after the iframe readiness handshake, and that messages from a different source/origin are ignored.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm --prefix frontend test -- --run tests/admin/live-preview.test.tsx tests/api/preview-draft.test.tsx`

Expected: new draft and message-boundary assertions fail against the partial implementation.

- [ ] **Step 3: Implement the transport**

Use same-origin target/validation, require the message source to be the known iframe/parent, include the draft `kind` in the readiness handshake, and show an in-memory-draft status in the toolbar. Do not persist to storage or an API.

- [ ] **Step 4: Re-run focused tests**

Expected: all draft-channel tests pass.

### Task 2: Overlay drafts in public renderers and wire bespoke editors

**Files:**
- Modify: `frontend/src/public-site/SiteDataProvider.tsx`
- Modify: `frontend/src/pages/LocationPage.jsx`
- Modify: `frontend/src/pages/Oferte.jsx`
- Modify: `frontend/src/pages/TreatmentDetail.jsx`
- Modify: `frontend/src/pages/DoctorPage.jsx`
- Modify: `frontend/src/admin/features/clinics/ClinicEditorScreen.tsx`
- Modify: `frontend/src/admin/features/offers/OfferEditorScreen.tsx`
- Modify: `frontend/src/admin/features/treatments/TreatmentEditorScreen.tsx`
- Modify: `frontend/src/admin/features/doctors/DoctorEditorScreen.tsx`
- Create: `frontend/tests/public-site/draft-preview.test.tsx`

- [ ] **Step 1: Add failing public overlay tests**

Cover a new clinic route that does not yet exist in bootstrap, an inactive/new offer added to the offers page, a new treatment detail, and a new doctor profile.

- [ ] **Step 2: Run tests and confirm the saved API data still renders but draft data does not**

Run: `npm --prefix frontend test -- --run tests/public-site/draft-preview.test.tsx`

- [ ] **Step 3: Implement entity overlays**

Watch each Ant Design form with `Form.useWatch`, normalize editor-only shapes such as comma-delimited offer features and treatment Markdown, pass `{kind, data}` into `LivePreview`, and let preview-mode public pages render the draft even when no saved API record matches the route.

- [ ] **Step 4: Verify focused tests**

Expected: draft values render and disappear when the preview component unmounts.

### Task 3: Extend generic resource previews

**Files:**
- Modify: `frontend/src/admin/components/ResourceScreen.tsx`
- Modify: `frontend/src/admin/components/ResourceEditorScreen.tsx`
- Modify: `frontend/src/admin/features/registry.tsx`
- Modify: `frontend/src/public-site/SiteDataProvider.tsx`
- Modify: `frontend/src/pages/Noutati.jsx`
- Modify: `frontend/src/pages/LegalContent.jsx`
- Modify: `frontend/src/pages/ScorIgiena.jsx`
- Modify: `frontend/tests/admin/resource-screen.test.tsx`

- [ ] **Step 1: Add config-level draft metadata tests**

Assert that preview-capable generic resources supply a draft kind and can calculate a create-preview path from current form values.

- [ ] **Step 2: Add `previewKind`, value-aware `previewPath`, and draft mapping**

Keep API field names unchanged while mapping news, homepage services, gallery images, legal documents, and quiz parent fields to their public shapes.

- [ ] **Step 3: Render generic drafts in the relevant real page**

Merge collection items for home/news and render legal/quiz parent draft content only in preview mode.

- [ ] **Step 4: Run resource and public preview tests**

Expected: create pages show the real target route without requiring save.

### Task 4: Add nested quiz authoring

**Files:**
- Create: `frontend/src/admin/features/quiz/QuizSubResources.tsx`
- Modify: `frontend/src/admin/components/ResourceScreen.tsx`
- Modify: `frontend/src/admin/components/ResourceEditorScreen.tsx`
- Modify: `frontend/src/admin/features/registry.tsx`
- Create: `frontend/tests/admin/quiz-editor.test.tsx`

- [ ] **Step 1: Add a failing quiz editor test**

Render `/admin/quiz/:id`, return parent/question/option/band fixtures from MSW, and assert visible sections for “Întrebări și răspunsuri” and “Rezultate”.

- [ ] **Step 2: Add an editor extension point**

Extend `ResourceConfig` with an optional edit-only component receiving the saved row, client, and preview refresh callback.

- [ ] **Step 3: Implement nested CRUD**

Use `/v1/admin/quiz-questions`, `/v1/admin/quiz-options`, and `/v1/admin/quiz-result-bands`; include parent IDs on create, `If-Match` versions on update/delete, Romanian labels, ordering, scores, result ranges, descriptions, recommendations, and treatment CTA selection.

- [ ] **Step 4: Verify create behavior**

On `/admin/quiz/nou`, show an informational prompt to save the quiz before child records can be added; on edit, show the full nested editor.

- [ ] **Step 5: Run the focused quiz test**

Expected: nested records render and create/edit/delete requests use their correct parent IDs and versions.

### Task 5: Remove technical/admin dead UI and close tracking

**Files:**
- Modify: `frontend/src/admin/features/clinics/ClinicsScreen.tsx`
- Modify: `frontend/src/admin/features/clinics/ClinicEditorScreen.tsx`
- Modify: `frontend/src/admin/features/treatments/TreatmentsScreen.tsx`
- Modify: `frontend/src/admin/features/treatments/TreatmentEditorScreen.tsx`
- Modify: `frontend/src/admin/features/offers/OffersScreen.tsx`
- Modify: `frontend/src/admin/features/offers/OfferEditorScreen.tsx`
- Modify: `frontend/src/admin/features/doctors/DoctorEditorScreen.tsx`
- Modify: `frontend/src/admin/features/editorial/ArticleEditorScreen.tsx`
- Modify: `frontend/src/admin/features/registry.tsx`
- Modify: `frontend/src/admin/layout/adminNavigation.ts`
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`
- Delete: `frontend/src/admin/features/site/SiteSettingsScreen.tsx`
- Modify: `docs/TODO.md`

- [ ] **Step 1: Replace visible “Slug” terminology**

Use “Adresă URL” for form fields and “Adresă” for compact table columns. Do not rename the backend/TypeScript `slug` contract.

- [ ] **Step 2: Remove the site-settings page**

Delete its navigation item, route mapping/import, component, and stale tests/references. `/admin/setari` should fall through to the existing nonexistent-section state.

- [ ] **Step 3: Update TODO**

Mark draft preview, nested quiz editing, terminology cleanup, and site-settings removal complete; correct stale duplicate gallery/CAS checklist entries.

- [ ] **Step 4: Run full verification**

Run: `npm --prefix frontend run typecheck`

Run: `npm --prefix frontend test -- --run`

Run: `npm --prefix frontend run build`

Expected: TypeScript clean, all Vitest tests pass, and Vite production build succeeds.

### Task 6: Restore the master homepage services design and add doctor carousel behavior

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/Home.css`
- Modify: `frontend/src/components/sections/DoctorTeam.jsx`
- Modify: `frontend/src/components/sections/Sections.css`
- Create: `frontend/tests/public-site/home-sections.test.tsx`

- [ ] **Step 1: Compare the current service section with `master`**

Read the `Home.jsx`/`Home.css` implementation directly from `master`, identify markup and CSS drift, and preserve the API-backed `homepage_services` data source while restoring the master presentation.

- [ ] **Step 2: Add behavior tests**

Assert that `/admin/servicii-dentnow` remains configured for CRUD and that exactly three doctors use the static grid while four or more use a horizontally scrollable region.

- [ ] **Step 3: Implement the carousel**

For at least four doctors, render a horizontal, accessible carousel that advances one card every three seconds, pauses on pointer/focus interaction, supports manual previous/next controls, and respects reduced motion. Keep three or fewer doctors as the existing grid.

- [ ] **Step 4: Verify section tests and responsive styling**

Expected: API-authored services use the restored master visual treatment and the doctor carousel does not activate below four records.

### Task 7: Make clinic child editing correctly scoped and available before first save

**Files:**
- Modify: `frontend/src/admin/features/clinics/ClinicEditorScreen.tsx`
- Modify: `frontend/src/admin/features/clinics/ClinicSubResources.tsx`
- Modify: `frontend/src/admin/features/clinics/clinics.css`
- Modify: `frontend/src/pages/LocationPage.jsx`
- Create: `frontend/tests/admin/clinic-editor.test.tsx`

- [ ] **Step 1: Reproduce the cross-clinic leak with fixtures**

Return contacts/hours/transit/FAQ rows for two clinics and assert that the editor for clinic A must never render clinic B rows.

- [ ] **Step 2: Scope every edit collection**

Filter contacts, hours, transit, and FAQs by `clinic_id` before rendering; ensure create payloads always inject the current clinic ID and cache keys include it.

- [ ] **Step 3: Add local child `Form.List` sections for `/nou`**

Collect contact kind/value/label/primary status, weekday/open/close/closed state, transit mode/label/detail/order, and FAQ question/answer/order in the unsaved parent form. Include these arrays in the iframe draft.

- [ ] **Step 4: Persist local child rows after parent creation**

POST the clinic first, then POST each draft child to its existing endpoint with the new `clinic_id`; report partial child-save failures explicitly and navigate to the saved editor only after the creation workflow completes.

- [ ] **Step 5: Verify preview completeness**

Ensure the location page formats draft hours from data rather than hardcoded text, uses draft contacts/transit/FAQ/map fields, and never redirects away while awaiting the first preview handshake.

### Task 8: Add explicit public/admin 403, 404, and 503 states

**Files:**
- Create: `frontend/src/shared/StatusPage.tsx`
- Create: `frontend/src/shared/statusPage.css`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/public-site/PublicApp.tsx`
- Modify: `frontend/src/public-site/SiteDataProvider.tsx`
- Modify: `frontend/src/admin/pages/AccessDeniedPage.tsx`
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`
- Create: `frontend/tests/status-pages.test.tsx`

- [ ] **Step 1: Add failing routing/error tests**

Assert unknown public resource/routes render 404, denied admin access renders 403, unknown/unauthorized admin sections render 403, and bootstrap/backend failure renders 503 with retry.

- [ ] **Step 2: Implement a shared branded status-page shell**

Provide clear Romanian titles, concise recovery actions, accessible status semantics, and distinct 403/404/503 codes without exposing backend error details.

- [ ] **Step 3: Route known failure conditions**

Replace redirects for missing doctors/clinics/treatments with a 404 page, replace generic admin empty fallbacks with 403 or 404 as appropriate, and render 503 from the bootstrap gate when the API is unavailable.

- [ ] **Step 4: Run focused and full verification**

Expected: all three states are deterministic, navigable, and covered by tests.
