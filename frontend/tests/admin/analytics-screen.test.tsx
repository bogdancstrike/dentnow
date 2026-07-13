import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as echarts from 'echarts/core';
import { AnalyticsScreen } from '../../src/admin/features/analytics/AnalyticsScreen';
import type { AdminClient } from '../../src/admin/api/adminClient';

vi.mock('echarts-for-react/lib/core', () => ({
  default: ({ style }: { style?: React.CSSProperties }) => (
    <div data-testid="apache-echarts" style={style} />
  ),
}));

const overview = {
  range: { from: '2026-07-07', to: '2026-07-13', timezone: 'Europe/Bucharest' },
  collection: {
    enabled: true, require_consent: true, raw_retention_days: 90,
    aggregate_retention_days: 730, full_events: 360, limited_events: 120,
  },
  kpis: {
    visitors: 120, sessions: 160, page_views: 480, cta_clicks: 18,
    new_visitors: 92, returning_visitors: 28, cta_conversion: 15,
    deltas: { visitors: 12.5, sessions: 8, page_views: -2, cta_clicks: null },
  },
  trend: [
    { date: '2026-07-12', visitors: 50, sessions: 70, page_views: 210, cta_clicks: 7 },
    { date: '2026-07-13', visitors: 70, sessions: 90, page_views: 270, cta_clicks: 11 },
  ],
  top_pages: [{ key: '/', views: 250, visitors: 100 }],
  top_sections: [], top_articles: [{ key: 'implant-dentar', views: 80, visitors: 60 }],
  top_treatments: [], top_offers: [], top_clinics: [],
  contact_ctas: [{ key: 'telefon', views: 18, visitors: 16 }],
  referrers: [{ key: 'google.com', views: 90, visitors: 70 }],
  devices: [{ key: 'mobile', views: 320, visitors: 85 }],
  browsers: [{ key: 'Chrome', views: 360, visitors: 90 }],
  operating_systems: [{ key: 'Android', views: 220, visitors: 65 }],
  internet_providers: [{ key: 'RCS & RDS', views: 180, visitors: 52 }],
  timezones: [{ key: 'Europe/Bucharest', views: 300, visitors: 80 }],
  ip_addresses: [{ key: '203.0.113.1', views: 8, visitors: 1 }],
  user_agents: [{ key: 'Mozilla/5.0 Chrome/126', views: 8, visitors: 1 }],
  geography: [{ country: 'RO', region: 'București', city: 'București', latitude: 44.4268, longitude: 26.1025, visitors: 80, views: 300 }],
};

function renderScreen(client: Partial<AdminClient>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/analytics?range=7']}>
        <AnalyticsScreen client={client as AdminClient} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AnalyticsScreen', () => {
  it('renders KPIs, accessible chart, technical and geographic statistics', async () => {
    const client = { get: vi.fn().mockResolvedValue({ data: overview }), download: vi.fn() };
    renderScreen(client);
    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Evoluție trafic în 2 zile/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Hartă România cu 1 zone/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Hartă București cu distribuția pe șase sectoare/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('apache-echarts')).toHaveLength(3);
    expect(echarts.getMap('dentnow-romania')).toBeDefined();
    expect(echarts.getMap('dentnow-bucharest-sectors')).toBeDefined();
    expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    expect(screen.getByText('Mozilla/5.0 Chrome/126')).toBeInTheDocument();
    expect(screen.getByText('Clickuri pe telefon, WhatsApp și e-mail')).toBeInTheDocument();
    expect(screen.getByText('RCS & RDS')).toBeInTheDocument();
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('from='));
  });

  it('shows a retryable error state', async () => {
    renderScreen({ get: vi.fn().mockRejectedValue(new Error('backend unavailable')) });
    expect(await screen.findByText('Datele analytics nu au putut fi încărcate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reîncearcă' })).toBeInTheDocument();
  });
});
