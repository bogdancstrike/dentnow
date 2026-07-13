# Manual Google Reviews CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace automatic Google Places review ingestion with manually authored Google reviews, exposed through a focused `/admin/reviws` CRUD and unsaved live preview.

**Architecture:** Remove the only Google Places network client, API-key setting, and clinic place identifier. Keep reviews in the existing first-party PostgreSQL/admin/public APIs: the server supplies internal publication/date/source defaults while the administrator edits only author, review text, and 1–5 stars. The real `/recenzii` route merges a browser-only `review` preview draft so create/edit changes are visible without persistence.

**Tech Stack:** Flask/qf endpoint map, SQLAlchemy/Alembic, Pydantic, pytest, React 18, TypeScript, Ant Design 6, TanStack Query, Vitest/Testing Library.

---

### Task 1: Remove automatic Google Places ingestion

**Files:**
- Delete: `backend/scripts/sync_google_reviews.py`
- Create: `backend/migrations/versions/0014_remove_google_places_reviews.py`
- Modify: `backend/src/config.py`
- Modify: `backend/src/clinics/models.py`
- Modify: `backend/src/clinics/schemas.py`
- Modify: `backend/src/clinics/serializers.py`
- Test: `backend/tests/unit/test_config.py`

- [x] **Step 1: Write the failing source-boundary test**

```python
def test_google_places_review_ingestion_is_not_configurable():
    assert not hasattr(Config, "GOOGLE_PLACES_API_KEY")
    assert not (BACKEND_DIR / "scripts" / "sync_google_reviews.py").exists()
```

- [x] **Step 2: Run the test and verify that the legacy key/script make it fail**

Run: `pytest backend/tests/unit/test_config.py -q`

- [x] **Step 3: Delete the network script and remove `GOOGLE_PLACES_API_KEY`/`google_place_id`**

Migration upgrade drops `clinics.google_place_id`; downgrade restores it as nullable `VARCHAR(255)`. Remove that field from the ORM model, create/update schemas, and serializer.

- [x] **Step 4: Run config, schema, and migration tests**

Run: `pytest backend/tests/unit/test_config.py backend/tests/integration/test_migrations.py -q`

### Task 2: Constrain reviews to manual authoring

**Files:**
- Modify: `backend/src/editorial/schemas.py`
- Modify: `backend/src/editorial/service.py`
- Modify: `backend/src/api/editorial_admin.py`
- Modify: `backend/maps/endpoint.json`
- Modify: `backend/src/site/search_service.py`
- Test: `backend/tests/unit/test_editorial_service.py`
- Test: `backend/tests/contract/test_public_api.py`

- [x] **Step 1: Write failing schema/service tests**

```python
def test_manual_review_contract_rejects_google_ingestion_metadata():
    review = ReviewCreate(author="Ana", text_body="Foarte atent.", rating=5)
    assert review.model_dump() == {"author": "Ana", "text_body": "Foarte atent.", "rating": 5, "position": 0}
    with pytest.raises(PydValidationError):
        ReviewCreate(author="Ana", text_body="Bine", rating=5, source_url="https://google.test")
```

- [x] **Step 2: Run the unit test and verify the old date/source contract fails**

Run: `pytest backend/tests/unit/test_editorial_service.py -q`

- [x] **Step 3: Implement server-owned defaults and item GET**

`ReviewCreate` accepts only `author`, `text_body`, `rating`, and `position`; `ReviewUpdate` accepts their optional equivalents. `ReviewService.to_create_kwargs()` injects today's exact date, `source="google"`, and `status="published"`. Add `GET /v1/admin/reviews/<review_id>` and point search results to `/admin/reviws`.

- [x] **Step 4: Run unit and contract tests**

Run: `pytest backend/tests/unit/test_editorial_service.py backend/tests/contract/test_public_api.py backend/tests/contract/test_endpoint_map.py -q`

### Task 3: Build `/admin/reviws` CRUD with real live preview

**Files:**
- Modify: `frontend/src/admin/layout/adminNavigation.ts`
- Modify: `frontend/src/admin/features/registry.tsx`
- Create: `frontend/src/hooks/useReviews.js`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/Recenzii.jsx`
- Modify: `frontend/src/components/ui/ReviewCard.jsx`
- Test: `frontend/tests/admin/reviews-editor.test.tsx`
- Test: `frontend/tests/public-site/reviews.test.tsx`

- [x] **Step 1: Write failing admin and public rendering tests**

```tsx
expect(ADMIN_NAV_ITEMS).toContainEqual(expect.objectContaining({ slug: 'reviws', key: 'reviews' }));
expect(getResourceConfig('reviews')).toMatchObject({ endpoint: '/v1/admin/reviews', previewKind: 'review' });
expect(screen.getByLabelText('Stele')).toBeInTheDocument();
expect(screen.queryByLabelText(/sursă|dată/i)).not.toBeInTheDocument();
```

- [x] **Step 2: Run tests and verify the removed admin module/mismatched public card fail**

Run: `npm test -- --run tests/admin/reviews-editor.test.tsx tests/public-site/reviews.test.tsx`

- [x] **Step 3: Implement the Ant Design form and browser-only draft merge**

Use a keyboard-enabled Ant Design `Rate` (`allowClear={false}`), required author/text fields, drag ordering, a `/recenzii` `LivePreview`, and `previewKind: "review"`. Merge the draft by original position for edits and prepend it for creates; render `text_body` and exactly `rating` filled stars in `ReviewCard`.

- [x] **Step 4: Run focused tests, typecheck, Ant Design lint, and production build**

Run: `npm test -- --run tests/admin/reviews-editor.test.tsx tests/public-site/reviews.test.tsx && npm run typecheck && npx antd lint src/admin/features/registry.tsx --format json && npm run build`

### Task 4: Seed/docs verification and delivery

**Files:**
- Modify: `backend/scripts/seed_current_site.py`
- Modify: `docs/TODO.md`
- Modify: `docs/implementation_plan.md`

- [x] **Step 1: Remove legacy automatic-sync requirements from the implementation documents**

Document that Google reviews are copied manually by an administrator, the canonical UI route is `/admin/reviws`, and no Google Places API key/place identifier/network job exists.

- [x] **Step 2: Run the complete proportional verification**

Run: backend unit/contract suites affected by clinics/editorial/migrations and the complete frontend test/typecheck/build set. Run targeted Ruff/ESLint and `git diff --check`.

- [x] **Step 3: Commit and push this isolated task**

```bash
git add <only manual-review task files>
git commit -m "feat(reviews): add manual reviews administration"
git push
```
