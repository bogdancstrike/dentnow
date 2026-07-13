import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({
    navigation: {
      desktop: [
        { label: 'Acasă API', target_path: '/', children: [] },
        {
          label: 'Catalog API',
          target_path: '/catalog-api',
          children: [
            { label: 'Serviciu API', target_path: '/serviciu-api', children: [] },
          ],
        },
      ],
      mobile: [
        { label: 'Mobil API', target_path: '/mobil-api', children: [] },
      ],
    },
  }),
}));
vi.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}));
vi.mock('../../src/hooks/useClinicPicker', () => ({
  useClinicPicker: () => vi.fn(),
}));
vi.mock('../../src/api/publicClient', () => ({
  publicQueryKeys: { treatments: ['public', 'treatments'] },
  fetchTreatments: async () => [],
}));

import Navbar from '../../src/components/layout/Navbar';

describe('Navbar', () => {
  it('renders the published desktop and mobile navigation without compiled fallback links', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><Navbar /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Acasă API' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Catalog API' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Catalog API' }));
    expect(screen.getByRole('link', { name: 'Serviciu API' })).toHaveAttribute('href', '/serviciu-api');

    await user.click(screen.getByRole('button', { name: 'Meniu' }));
    expect(screen.getByRole('link', { name: 'Mobil API' })).toHaveAttribute('href', '/mobil-api');
    expect(screen.queryByRole('link', { name: 'Oferte' })).not.toBeInTheDocument();
  });
});
