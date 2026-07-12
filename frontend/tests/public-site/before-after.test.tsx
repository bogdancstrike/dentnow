import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

vi.mock('../../src/hooks/useClinicPicker', () => ({ useClinicPicker: () => vi.fn() }));

import BeforeAfter from '../../src/pages/BeforeAfter';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('BeforeAfter', () => {
  it('renders approved API cases in persisted order with their media', async () => {
    server.use(
      http.get('/api/v1/public/case-studies', () => HttpResponse.json({
        items: [
          {
            id: 'case-1',
            title: 'Caz configurat din admin',
            treatment: 'Implantologie',
            description: 'Descriere publică.',
            disclaimer: 'Rezultatele pot varia.',
            before_media_id: 'before-id',
            after_media_id: 'after-id',
            position: 0,
          },
        ],
      })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <BeforeAfter />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Caz configurat din admin')).toBeInTheDocument();
    expect(screen.getByText('Rezultatele pot varia.')).toBeInTheDocument();
    expect(screen.getByAltText('Caz configurat din admin înainte')).toHaveAttribute(
      'src',
      '/api/v1/public/media/before-id/hero',
    );
  });
});
