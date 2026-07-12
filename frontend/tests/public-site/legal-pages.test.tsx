import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';
import GDPR from '../../src/pages/GDPR';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('legal public pages', () => {
  it('renders the active admin document instead of compiled legal copy', async () => {
    server.use(
      http.get('/api/v1/public/legal/gdpr', () => HttpResponse.json({
        legal_document: {
          doc_type: 'gdpr',
          version_label: '2026.07',
          effective_date: '2026-07-13',
          body_html: '<h2>Document GDPR administrat</h2><p>Text public din baza de date.</p>',
        },
      })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <GDPR />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Document GDPR administrat' })).toBeInTheDocument();
    expect(screen.getByText('Text public din baza de date.')).toBeInTheDocument();
    expect(screen.getByText(/13 iulie 2026/i)).toBeInTheDocument();
  });
});
