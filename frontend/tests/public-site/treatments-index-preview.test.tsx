import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/api/previewDraft', () => ({
  usePreviewDraft: () => ({
    name: 'Tratament nou în preview',
    slug: 'tratament-nou',
    category_label: 'Categorie preview',
    category_slug: 'categorie-preview',
    prices: [],
  }),
}));
vi.mock('../../src/api/publicClient', () => ({
  publicQueryKeys: { treatments: ['public', 'treatments'] },
  fetchTreatments: async () => [],
}));
vi.mock('../../src/hooks/useClinicPicker', () => ({ useClinicPicker: () => vi.fn() }));
vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useOptionalSiteData: () => ({ site: { site_name: 'Clinica Test' }, links: [], clinics: [] }),
}));

import Tratamente from '../../src/pages/Tratamente';

describe('treatments index preview', () => {
  it('renders a new treatment draft on /tratamente without creating a detail link', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter><Tratamente /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Tratament nou în preview')).toBeInTheDocument();
    expect(screen.getAllByText('Categorie preview')).toHaveLength(2);
    expect(container.querySelector('a[href="/tratamente/tratament-nou"]')).toBeNull();
  });
});
