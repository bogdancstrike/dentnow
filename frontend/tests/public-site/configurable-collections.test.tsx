import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

const siteData = {
  site: { site_name: 'Clinica Test' },
  links: [{ kind: 'phone', label: 'Programări', value: '+40700000000' }],
  clinics: [],
  technologies: [
    { name: 'Scanner din Admin', description: 'Descriere din bootstrap.', position: 0 },
  ],
  ebooks: [
    {
      slug: 'ghid-din-admin',
      title: 'Ghid din Admin',
      category: 'Prevenție',
      description: 'Conținut din bootstrap.',
      position: 0,
    },
  ],
};

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => siteData,
  useOptionalSiteData: () => siteData,
}));

vi.mock('../../src/hooks/useSiteTexts', () => ({
  useSiteTexts: () => (key: string) => key,
}));

import TechnologySection from '../../src/components/sections/TechnologySection';
import Ebook from '../../src/pages/Ebook';

afterEach(cleanup);

describe('Admin-configurable public collections', () => {
  it('renders technologies from the bootstrap', () => {
    render(<TechnologySection />);
    expect(screen.getByRole('heading', { name: 'Scanner din Admin' })).toBeInTheDocument();
    expect(screen.getByText('Descriere din bootstrap.')).toBeInTheDocument();
  });

  it('renders e-books from the bootstrap', () => {
    render(<Ebook />);
    expect(screen.getByRole('heading', { name: 'Ghid din Admin' })).toBeInTheDocument();
    expect(screen.getByText('Conținut din bootstrap.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cere pe WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/40700000000'),
    );
  });
});
