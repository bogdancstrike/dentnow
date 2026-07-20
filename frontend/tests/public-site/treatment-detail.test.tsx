import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/api/publicClient', () => ({
  publicQueryKeys: { treatments: ['public', 'treatments'] },
  fetchTreatments: async () => [{
    slug: 'cat-consultatie-1',
    name: 'Pachet Consultație primară + Igienizare completă',
    category_label: 'Consultații & Diagnostic',
    category_slug: 'consultatie',
    summary: null,
    detail_html: null,
    prices: [{
      price_kind: 'exact',
      amount: 350,
      old_amount: 550,
      currency: 'RON',
      note: '350 lei',
    }],
  }],
}));
vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({ clinics: [] }),
}));
vi.mock('../../src/hooks/useClinicPicker', () => ({
  useClinicPicker: () => vi.fn(),
}));
vi.mock('../../src/api/previewDraft', () => ({
  isPreviewMode: () => false,
  usePreviewDraft: () => null,
}));
vi.mock('../../src/components/seo/Seo', () => ({ default: () => null }));

import TreatmentDetail from '../../src/pages/TreatmentDetail';

describe('TreatmentDetail', () => {
  it('renders a useful compact page when Admin has no summary or detail body', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tratamente/cat-consultatie-1']}>
          <TreatmentDetail />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', {
      name: 'Pachet Consultație primară + Igienizare completă',
    })).toBeInTheDocument();
    expect(screen.getByText('350 RON')).toBeInTheDocument();
    expect(screen.getByText('550 RON')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primul pas este evaluarea.' })).toBeInTheDocument();
    expect(container.querySelector('.sge-ai-box')).toBeNull();
    expect(container.querySelector('.treatment-detail-sec.is-compact')).not.toBeNull();
  });
});
