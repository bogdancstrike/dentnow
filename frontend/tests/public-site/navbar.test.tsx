import { describe, expect, it, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({
    site: { site_name: 'DentNow' },
    navigation: {
      desktop: [{
        label: 'Tratamente', target_path: '/tratamente', children: [
          { label: 'Toate tratamentele', target_path: '/tratamente', children: [] },
          { label: 'Implantologie', target_path: '/implant-dentar-bucuresti', children: [] },
          { label: 'Ortodonție', target_path: '/tratamente/ortodontie', children: [] },
          { label: 'Urgențe Dentare', target_path: '/urgente-dentare-bucuresti', children: [] },
        ],
      }],
      mobile: [
        { label: 'Acasa', target_path: '/', children: [] },
        { label: 'Tratamente si tarife', target_path: '/tratamente', children: [] },
        { label: 'Implant Dentar București', target_path: '/implant-dentar-bucuresti', children: [] },
        { label: 'Ortodonție', target_path: '/tratamente/ortodontie', children: [] },
        { label: 'Urgențe Dentare București', target_path: '/urgente-dentare-bucuresti', children: [] },
        { label: 'DentNow Victoriei', target_path: '/locatii/victoriei', children: [] },
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
  fetchTreatments: vi.fn().mockResolvedValue([
    { slug: 'extractie-molar', category_slug: 'chirurgie', category_label: 'Chirurgie orală' },
    { slug: 'igienizare-gbt', category_slug: 'preventie', category_label: 'Prevenție' },
  ]),
}));

import Navbar from '../../src/components/layout/Navbar';

describe('mobile navigation', () => {
  it('keeps only the treatments index and dental emergencies from the treatment section', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><Navbar /></MemoryRouter>
      </QueryClientProvider>,
    );

    const mobile = document.querySelector('#mobile-navigation') as HTMLElement;
    expect(mobile).not.toBeNull();
    expect(await within(mobile).findByRole('link', { name: 'DentNow Victoriei' })).toHaveAttribute('href', '/locatii/victoriei');
    expect(mobile).toHaveTextContent('Tratamente si tarife');
    expect(mobile).toHaveTextContent('Urgențe Dentare București');
    expect(mobile).not.toHaveTextContent('Implantologie');
    expect(mobile).not.toHaveTextContent('Ortodonție');
    expect(mobile).not.toHaveTextContent('Implant Dentar București');

    const desktop = document.querySelector('.nav-links') as HTMLElement;
    expect(await within(desktop).findByRole('link', { name: 'Chirurgie orală' })).toHaveAttribute('href', '/tratamente#chirurgie');
    expect(desktop).toHaveTextContent('Prevenție');
    expect(desktop).not.toHaveTextContent('Implantologie');
  });
});
