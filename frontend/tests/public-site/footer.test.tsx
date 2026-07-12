import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({
    links: [
      { kind: 'email', label: 'Email', value: 'contact@dentnow.test', url: 'mailto:contact@dentnow.test' },
      { kind: 'social', label: 'facebook', value: 'https://facebook.test/dentnow' },
    ],
    clinics: [
      {
        slug: 'dristor',
        name: 'DentNow Dristor',
        area: 'Dristor',
        map_link_url: 'https://maps.test/dristor',
        contacts: [{ kind: 'phone', display_value: '0700 000 001', normalized_value: '+40700000001', url: 'tel:+40700000001' }],
      },
      {
        slug: 'victoriei',
        name: 'DentNow Victoriei',
        area: 'Victoriei',
        map_link_url: 'https://maps.test/victoriei',
        contacts: [
          { kind: 'phone', display_value: '0700 000 002', normalized_value: '+40700000002', url: 'tel:+40700000002' },
          { kind: 'whatsapp', display_value: 'WhatsApp', normalized_value: '+40700000002', url: 'https://wa.me/40700000002' },
        ],
      },
    ],
  }),
}));
vi.mock('../../src/api/publicClient', () => ({
  publicQueryKeys: { treatments: ['public', 'treatments'] },
  fetchTreatments: async () => [
    { slug: 'implant-dentar', name: 'Implant dentar' },
    { slug: 'igienizare', name: 'Igienizare profesională' },
  ],
}));

import Footer from '../../src/components/layout/Footer';

describe('Footer', () => {
  it('uses dynamic services, clinics, and contacts while keeping every internal link valid', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter><Footer /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Implant dentar' })).toHaveAttribute('href', '/tratamente/implant-dentar');
    expect(screen.getAllByRole('link', { name: /DentNow Victoriei/ })[0]).toHaveAttribute('href', '/locatii/victoriei');
    expect(screen.getByRole('link', { name: '0700 000 002' })).toHaveAttribute('href', 'tel:+40700000002');
    expect(screen.getAllByRole('link', { name: /WhatsApp/i }).some(
      (link) => link.getAttribute('href') === 'https://wa.me/40700000002',
    )).toBe(true);
    expect(screen.queryByText('DentNow Baba Novac')).not.toBeInTheDocument();

    const fixedRoutes = new Set([
      '/', '/tratamente', '/urgente-dentare-bucuresti', '/decontat-cas', '/oferte',
      '/articole', '/noutati', '/before-after', '/scor-igiena', '/ebook', '/parteneri',
      '/gdpr', '/confidentialitate', '/termeni',
    ]);
    const internalLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'));
    expect(internalLinks.length).toBeGreaterThan(10);
    for (const link of internalLinks) {
      const href = link.getAttribute('href') || '';
      expect(
        fixedRoutes.has(href)
        || href.startsWith('/tratamente/')
        || href.startsWith('/locatii/'),
      ).toBe(true);
    }
  });
});
