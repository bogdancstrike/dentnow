import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { ArticlesScreen } from '../../src/admin/features/editorial/ArticlesScreen';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const client = new AdminClient(async () => 'token');
  return render(
    <ConfigProvider>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/admin/articole']}>
            <Routes>
              <Route path="/admin/articole" element={<ArticlesScreen client={client} />} />
              <Route path="/admin/articole/:articleId" element={<div>Editor dedicat</div>} />
              <Route path="/admin/articole/nou" element={<div>Articol nou dedicat</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  );
}

describe('ArticlesScreen', () => {
  it('renders the newsroom list and opens editing as a dedicated route', async () => {
    server.use(
      http.get('/api/v1/admin/articles', () =>
        HttpResponse.json({
          items: [
            {
              id: 'article-1',
              version: 2,
              title: 'Cum alegi periuța potrivită',
              slug: 'cum-alegi-periuta',
              category: 'Prevenție',
              status: 'published',
              author: 'Echipa DentNow',
              updated_at: '2026-07-12T10:00:00Z',
            },
          ],
          total: 1,
        }),
      ),
    );

    renderScreen();
    expect(await screen.findByText('Cum alegi periuța potrivită')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Cum alegi periuța potrivită'));
    expect(await screen.findByText('Editor dedicat')).toBeInTheDocument();
  });

  it('opens article creation on its own URL', async () => {
    server.use(
      http.get('/api/v1/admin/articles', () => HttpResponse.json({ items: [], total: 0 })),
    );
    renderScreen();
    await waitFor(() => expect(screen.getByRole('button', { name: /Articol nou/i })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Articol nou/i }));
    expect(await screen.findByText('Articol nou dedicat')).toBeInTheDocument();
  });
});

