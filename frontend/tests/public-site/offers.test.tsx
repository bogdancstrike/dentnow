import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';
import Oferte from '../../src/pages/Oferte';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('public offers', () => {
  it('shows the selected treatment and clinic as valid resource links', async () => {
    server.use(
      http.get('/api/v1/public/offers', () => HttpResponse.json({
        items: [{
          slug: 'oferta-implant',
          name: 'Ofertă implant',
          summary: 'Pachet personalizat.',
          currency: 'RON',
          features: [],
          treatments: [{ slug: 'implant-dentar', name: 'Implant dentar' }],
          clinics: [{ slug: 'dentnow-victoriei', name: 'DentNow Victoriei' }],
        }],
      })),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Oferte />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Implant dentar' }))
      .toHaveAttribute('href', '/tratamente');
    expect(screen.getByRole('link', { name: 'DentNow Victoriei' }))
      .toHaveAttribute('href', '/locatii/dentnow-victoriei');
  });
});
