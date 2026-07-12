import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({ partners: [
    { name: 'Partener poziția unu', relationship_type: 'Furnizor', badge: 'Premium', position: 0 },
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
  });
});
