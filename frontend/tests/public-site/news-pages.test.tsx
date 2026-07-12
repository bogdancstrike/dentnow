import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';
import Noutati from '../../src/pages/Noutati';
import NewsDetailPage from '../../src/pages/NewsDetailPage';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

function renderRoute(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/noutati" element={<Noutati />} />
          <Route path="/noutati/:slug" element={<NewsDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('news public pages', () => {
  it('shows a visible read-more action for every news card', async () => {
    server.use(
      http.get('/api/v1/public/news', () => HttpResponse.json({
        items: [
          { slug: 'program-special', title: 'Program special', summary: 'Program actualizat.' },
          { slug: 'clinica-noua', title: 'Clinică nouă', summary: 'O adresă nouă.' },
        ],
      })),
    );

    renderRoute('/noutati');

    expect(await screen.findByText('Program special')).toBeInTheDocument();
    expect(screen.getAllByText('Citește mai mult')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Clinică nouă.*Citește mai mult/i }))
      .toHaveAttribute('href', '/noutati/clinica-noua');
  });

  it('renders the admin-configured news body on its own route', async () => {
    server.use(
      http.get('/api/v1/public/news/program-special', () => HttpResponse.json({
        news_item: {
          slug: 'program-special',
          title: 'Program special',
          category: 'Program',
          summary: 'Program actualizat.',
          body_html: '<h2>Orarul clinicilor</h2><p>Consultați intervalele actualizate.</p>',
          published_at: '2026-07-13',
        },
      })),
    );

    renderRoute('/noutati/program-special');

    expect(await screen.findByRole('heading', { name: 'Orarul clinicilor' })).toBeInTheDocument();
    expect(screen.getByText('Consultați intervalele actualizate.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Înapoi la noutăți' })).toHaveAttribute('href', '/noutati');
  });
});
