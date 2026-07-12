# Admin Editorial Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic, drawer-based article administration with a professional full-screen editorial workspace and contextual sandboxed preview, while simplifying admin navigation.

**Architecture:** Keep the existing Keycloak-protected admin shell and qf CRUD API. Route the article list, create editor, and edit editor as distinct nested React Router URLs; the editor owns draft form state and renders an immediate blog-shaped preview inside a sandboxed iframe. Website publication/version controls are intentionally absent from the UI; preview belongs to the entity being edited.

**Tech Stack:** React 18, TypeScript, React Router 6, TanStack Query 5, Ant Design 6, cmdk, Vitest, Testing Library.

---

### Task 1: Simplify the admin information architecture

**Files:**
- Modify: `frontend/src/admin/layout/AdminLayout.tsx`
- Modify: `frontend/src/admin/components/CommandPalette.tsx`
- Modify: `frontend/src/admin/theme.ts`
- Delete: `frontend/src/admin/pages/OverviewPage.tsx`

- [ ] Remove the `Prezentare generală` and `Pagini & SEO` navigation entries.
- [ ] Redirect `/admin` to `/admin/clinici` and keep every remaining module deep-linkable.
- [x] Remove global website publication/version controls from the admin UI.
- [ ] Replace emoji/icon-like text with documented Ant Design icons and add a keyboard-visible skip link.
- [ ] Keep command palette navigation permission-aware and add direct “new article” and global preview actions.

### Task 2: Build the article management list

**Files:**
- Create: `frontend/src/admin/features/editorial/ArticlesScreen.tsx`
- Create: `frontend/src/admin/features/editorial/articles.css`
- Modify: `frontend/src/admin/features/registry.tsx`

- [ ] Fetch `/v1/admin/articles` with server pagination and render title, category, status, author, and update metadata.
- [ ] Navigate create to `/admin/articole/nou` and edit to `/admin/articole/:articleId` instead of opening a Drawer.
- [ ] Preserve ETag/version-aware delete behavior with confirmation and cache invalidation.
- [ ] Give the list a restrained editorial newsroom treatment with clear status labels and row actions.

### Task 3: Build the full-screen article editor and live preview

**Files:**
- Create: `frontend/src/admin/features/editorial/ArticleEditorScreen.tsx`
- Create: `frontend/src/admin/features/editorial/ArticleLivePreview.tsx`
- Modify: `frontend/src/admin/features/editorial/articles.css`

- [ ] Load an existing article from `/v1/admin/articles/:articleId`, or initialize a clean draft at `/admin/articole/nou`.
- [ ] Implement a full-screen form for title, slug, category, excerpt, author/reviewer, publication date, status, and Markdown body.
- [ ] Auto-suggest a kebab-case slug without overwriting a manually edited slug.
- [ ] Render an immediate, safe article-page preview from watched form values in a sandboxed iframe at desktop/mobile widths.
- [ ] Save through POST/PATCH with version conflict feedback, then navigate to the canonical edit URL.
- [ ] Warn before leaving with unsaved changes and expose a public-path preview link for published content.

### Task 4: Add regression coverage and update project status

**Files:**
- Create: `frontend/tests/admin/articles-screen.test.tsx`
- Create: `frontend/tests/admin/article-editor.test.tsx`
- Modify: `docs/TODO.md`

- [ ] Test dedicated list/create/edit routing and verify no article Drawer is rendered.
- [ ] Test existing article loading, form editing, live preview updates, POST creation, PATCH update, and conflict feedback.
- [ ] Run `npm --prefix frontend run typecheck` and expect success.
- [ ] Run `npm --prefix frontend run test -- --run` and expect all tests to pass.
- [ ] Run `npm --prefix frontend run lint` and expect success.
- [ ] Run `npm --prefix frontend exec -- antd lint src/admin --format json` and address actionable findings.
- [ ] Run `npm --prefix frontend run build` and expect a successful production bundle.
