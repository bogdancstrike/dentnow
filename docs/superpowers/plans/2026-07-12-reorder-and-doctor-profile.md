# Ordered Admin Content and Doctor Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all requested admin content tables persistently drag-reorderable, restrict quiz editing to its parent fields, and deliver a richer API-backed doctor profile with multiple photographs and accurate live preview.

**Architecture:** A reusable `SortableResourceTable` layer will wrap the documented Ant Design `Table.components` API and dnd-kit sensors, while each screen persists the reordered page through existing PATCH endpoints and record ETags. Public queries will consistently sort by `position`. Doctor profile expansion uses two additional nullable media foreign keys plus biography/approach text on the existing `doctors` table, avoiding a separate gallery CRUD for only two supporting photographs.

**Tech Stack:** React 18, TypeScript, Ant Design 6, TanStack Query, dnd-kit, Flask/qf, SQLAlchemy, PostgreSQL/Alembic, Vitest, pytest.

---

### Task 1: Remove nested quiz editing

**Files:**
- Modify: `frontend/src/admin/features/registry.tsx`
- Delete: `frontend/src/admin/features/quiz/QuizSubResources.tsx`
- Modify: `frontend/tests/admin/quiz-editor.test.tsx`

- [ ] Remove `QuizSubResources`, `editExtra`, and `editExtraHint` from the quiz resource configuration.
- [ ] Replace the nested-editor test with an editor contract assertion that only `title`, `slug`, and `intro` are rendered.
- [ ] Run `npm --prefix frontend test -- --run tests/admin/quiz-editor.test.tsx` and expect PASS.

### Task 2: Add the reusable sortable table

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/admin/components/SortableResourceTable.tsx`
- Create: `frontend/src/admin/components/sortableTable.css`
- Modify: `frontend/src/admin/components/ResourceTable.tsx`
- Create: `frontend/tests/admin/sortable-resource-table.test.tsx`

- [ ] Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`.
- [ ] Add a stable handle-only drag column using `DndContext`, pointer and keyboard sensors, `SortableContext`, and Ant Design's documented `components.body.row` extension.
- [ ] Expose this contract:

```ts
interface SortableTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnsType<T>;
  onReorder?: (rows: T[]) => void | Promise<void>;
  reordering?: boolean;
}
```

- [ ] Keep buttons and links clickable by attaching listeners only to the drag handle; provide `aria-label="Reordonează <name>"` and keyboard coordinates.
- [ ] Update `ResourceTable` with optional `onReorder` and `reordering` props while retaining stable `rowKey="id"` and pagination.
- [ ] Test pointer-independent reorder callback behavior and the accessible handle.

### Task 3: Persist reordered positions

**Files:**
- Create: `frontend/src/admin/hooks/useResourceReorder.ts`
- Modify: `frontend/src/admin/components/ResourceScreen.tsx`
- Modify: `frontend/src/admin/features/editorial/ArticlesScreen.tsx`
- Modify: `frontend/src/admin/features/clinics/ClinicsScreen.tsx`
- Modify: `frontend/src/admin/features/offers/OffersScreen.tsx`
- Modify: `frontend/src/admin/features/doctors/DoctorsScreen.tsx`
- Modify: `frontend/src/admin/features/partners/PartnersScreen.tsx`
- Modify: `frontend/src/admin/features/registry.tsx`
- Test: `frontend/tests/admin/resource-reorder.test.tsx`

- [ ] Implement a hook that assigns page-aware positions and patches only changed rows:

```ts
useResourceReorder({ client, endpoint, queryKey, page, pageSize })
// PATCH endpoint/id with { position: pageOffset + index }, If-Match row.version
```

- [ ] Query reorderable lists with `sort=position&order=asc`.
- [ ] Mark only `news`, `homepage-services`, and `gallery` generic configs as reorderable; legal and quiz remain static.
- [ ] Enable the hook for articles, offers, clinics, doctors, and partners.
- [ ] Show success/error feedback and invalidate both admin list data and relevant public queries after completion.
- [ ] Test that moving the final row to the first position sends the expected position PATCH calls with correct ETags.

### Task 4: Reorder CAS content and clinic FAQs

**Files:**
- Modify: `frontend/src/admin/features/decontat/DecontatCasScreen.tsx`
- Modify: `frontend/src/admin/features/clinics/ClinicSubResources.tsx`
- Modify: `frontend/src/admin/features/clinics/ClinicEditorScreen.tsx`
- Modify: `frontend/src/admin/features/clinics/clinics.css`
- Test: `frontend/tests/admin/clinic-subresources.test.tsx`
- Create: `frontend/tests/admin/decontat-reorder.test.tsx`

- [ ] Replace the CAS step and FAQ tables with the reusable sortable table and patch their `position` values.
- [ ] Make saved clinic FAQ rows draggable and scoped strictly to the current clinic.
- [ ] For `/admin/clinici/nou`, add a drag handle to each FAQ `Form.List` row and call the documented `move(from, to)` operation so unsaved order is included in the initial child POST requests.
- [ ] Normalize every new FAQ's `position` from its final array index before POST.
- [ ] Test CAS and saved/draft clinic FAQ order persistence.

### Task 5: Make public rendering honor positions

**Files:**
- Modify: `backend/src/api/public_content.py`
- Modify: `backend/src/site/snapshot_contract.py`
- Modify: `frontend/src/api/publicContracts.ts`
- Modify: `frontend/src/pages/Parteneri.jsx`
- Modify: `backend/tests/contract/test_public_api.py`

- [ ] Sort clinics, offers, and articles by `(position, stable label)` instead of slug.
- [ ] Include article `position` in public summaries.
- [ ] Add active partners ordered by position to bootstrap and type the partner contract.
- [ ] Render `/parteneri` from `useSiteData().partners` instead of compiled `src/data/content`.
- [ ] Assert reordered clinic/article/offer/partner data is returned in UI order.

### Task 6: Expand the doctor model and admin editor

**Files:**
- Create: `backend/migrations/versions/0013_doctor_profiles.py`
- Modify: `backend/src/clinics/models.py`
- Modify: `backend/src/clinics/schemas.py`
- Modify: `backend/src/clinics/serializers.py`
- Modify: `backend/src/clinics/service.py`
- Modify: `backend/src/api/public_content.py`
- Modify: `frontend/src/api/publicContracts.ts`
- Modify: `frontend/src/admin/features/doctors/DoctorsScreen.tsx`
- Modify: `frontend/src/admin/features/doctors/DoctorEditorScreen.tsx`
- Test: `backend/tests/contract/test_admin_crud.py`
- Test: `frontend/tests/admin/doctor-editor.test.tsx`

- [ ] Add nullable `description`, `approach`, `workspace_media_id`, and `secondary_media_id` fields; both media columns reference `media_assets(id)` with `ON DELETE SET NULL`.
- [ ] Accept, coerce, serialize, and expose the new fields through admin and public APIs.
- [ ] Add multiline „Descriere completă” and „Abordare medicală” fields plus two independent image upload fields to the doctor editor.
- [ ] Include the new values in `Precompletează` and in the browser-only doctor draft.
- [ ] Test create/update round trips and unsaved preview payloads.

### Task 7: Redesign `/echipa/:slug`

**Files:**
- Modify: `frontend/src/pages/DoctorPage.jsx`
- Modify: `frontend/src/pages/DoctorPage.css`
- Modify: `frontend/tests/public-site/doctor-team.test.tsx`
- Create: `frontend/tests/public-site/doctor-page.test.tsx`

- [ ] Build a refined clinical-editorial profile: portrait and identity header, focused biography, credentials panel, approach statement, optional two-photo story strip, and appointment/team CTAs.
- [ ] Hide optional sections cleanly when fields or photographs are absent; retain the neutral DentNow fallback only for the main portrait.
- [ ] Render unsaved draft values immediately in the real preview route.
- [ ] Test rich and minimal doctor variants, missing-resource 404, and draft overlay behavior.

### Task 8: Validate and document

**Files:**
- Modify: `docs/TODO.md`

- [ ] Run `npx antd lint <each changed admin path> --format json` and resolve actionable findings.
- [ ] Run `npm --prefix frontend test -- --run`, `npm --prefix frontend run typecheck`, and `npm --prefix frontend run build`.
- [ ] Run `PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/contract backend/tests/unit -q`.
- [ ] Run `git diff --check`.
- [ ] Rebuild the API/frontend Compose services, migrate through `0013`, and verify a drag reorder changes the public sequence after refresh.
- [ ] Mark quiz restriction, requested reorder surfaces, and expanded doctor profiles complete in `docs/TODO.md`.
