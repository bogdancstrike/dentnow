import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { ArticleEditorScreen } from '../../src/admin/features/editorial/ArticleEditorScreen';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

function renderEditor(path = '/admin/articole/nou') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const client = new AdminClient(async () => 'token');
  return render(
    <ConfigProvider>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/admin/articole/nou" element={<ArticleEditorScreen client={client} />} />
              <Route path="/admin/articole/:articleId" element={<ArticleEditorScreen client={client} />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  );
}

describe('ArticleEditorScreen', () => {
  it('updates the blog preview immediately from unsaved form values', async () => {
    server.use(
      http.get('/api/v1/admin/articles', () => HttpResponse.json({ items: [], total: 0 })),
    );
    renderEditor();
    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText('Titlu'), { target: { value: 'Igiena orală în fiecare zi' } });
    fireEvent.change(screen.getByLabelText(/^Rezumat/), { target: { value: 'Un ghid simplu pentru o rutină corectă.' } });
    await user.type(screen.getByRole('textbox', { name: 'Editor vizual pentru conținut' }), 'Pașii esențiali. Periaj de două ori pe zi.');

    const preview = screen.getByTitle('Previzualizare live a articolului');
    await waitFor(() => {
      const document = preview.getAttribute('srcdoc') ?? '';
      expect(document).toContain('Igiena orală în fiecare zi');
      expect(document).toContain('Un ghid simplu pentru o rutină corectă.');
      expect(document).toContain('Pașii esențiali');
    });
    expect(screen.getByDisplayValue('igiena-orala-in-fiecare-zi')).toBeInTheDocument();
  });

  it('creates a draft and navigates to its canonical edit URL', async () => {
    let submitted: Record<string, unknown> | undefined;
    server.use(
      http.get('/api/v1/admin/articles', () => HttpResponse.json({ items: [], total: 0 })),
      http.post('/api/v1/admin/articles', async ({ request }) => {
        submitted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'article-created',
          version: 1,
          title: submitted.title,
          slug: submitted.slug,
          body_markdown: submitted.body_markdown,
          category: null,
          excerpt: null,
          author: null,
          reviewer: null,
          published_at: null,
          reviewed_at: null,
          status: 'draft',
          position: 0,
          updated_at: '2026-07-12T10:00:00Z',
        }, { status: 201 });
      }),
      http.get('/api/v1/admin/articles/article-created', () => HttpResponse.json({
        id: 'article-created', version: 1, title: 'Articol test', slug: 'articol-test',
        body_markdown: 'Conținut test', category: null, excerpt: null, author: null,
        reviewer: null, published_at: null, reviewed_at: null, status: 'draft', position: 0,
        updated_at: '2026-07-12T10:00:00Z',
      })),
    );
    renderEditor();
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Titlu'), { target: { value: 'Articol test' } });
    await user.type(screen.getByRole('textbox', { name: 'Editor vizual pentru conținut' }), 'Conținut test');
    await user.click(screen.getByRole('button', { name: /Salvează articolul/i }));

    await waitFor(() => expect(submitted).toMatchObject({
      title: 'Articol test',
      slug: 'articol-test',
      body_markdown: 'Conținut test',
      status: 'draft',
    }));
    await waitFor(() => expect(screen.getByText('/articol-test')).toBeInTheDocument());
  });
});
