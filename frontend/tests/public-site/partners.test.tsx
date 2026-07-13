import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({ partners: [
    {
      name: 'Partener poziția unu',
      relationship_type: 'Furnizor',
      badge: 'Premium',
      logo_media_id: 'logo-1',
      rights_note: 'Logo utilizat cu acordul partenerului.',
      link_url: 'https://partner.example',
      position: 0,
    },
    { name: 'Partener poziția doi', relationship_type: 'Tehnologie', badge: 'Digital', position: 1 },
  ] }),
}));
vi.mock('../../src/api/publicClient', () => ({ mediaUrl: (id: string) => `/media/${id}` }));

import Parteneri from '../../src/pages/Parteneri';

describe('Parteneri', () => {
  it('renders API partners in their supplied position order', () => {
    render(<Parteneri />);
    const names = screen.getAllByText(/Partener poziția/);
    expect(names.map((node) => node.textContent)).toEqual(['Partener poziția unu', 'Partener poziția doi']);
    expect(screen.getByRole('img', { name: 'Logo Partener poziția unu' }))
      .toHaveAttribute('src', '/media/logo-1');
    expect(screen.getByText('Logo utilizat cu acordul partenerului.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Website partener/ }))
      .toHaveAttribute('href', 'https://partner.example');
  });
});
