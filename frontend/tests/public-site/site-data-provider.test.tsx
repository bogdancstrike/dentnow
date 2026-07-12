import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import {
  SiteDataProvider,
  useSiteData,
} from '../../src/public-site/SiteDataProvider';
import {
  loadRuntimeConfig,
  __resetRuntimeConfigForTests,
} from '../../src/config/runtime';

const BOOTSTRAP = {
  release_version: 3,
  site: { site_name: 'DentNow', default_locale: 'ro-RO', default_timezone: 'Europe/Bucharest' },
  links: [],
  navigation: {},
  clinics: [{ slug: 'dristor', name: 'DentNow Dristor', contacts: [], hours: [] }],
};

function ShowSite() {
  const data = useSiteData();
  return <div>site: {data.site.site_name} / clinics: {data.clinics.length}</div>;
}

function noRetryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig(); // MSW serves /config.json with apiBase "/api"
});

describe('SiteDataProvider', () => {
  it('renders children with bootstrap data on success', async () => {
    server.use(
      http.get('/api/v1/public/bootstrap', () => HttpResponse.json(BOOTSTRAP)),
    );
    render(
      <SiteDataProvider client={noRetryClient()}>
        <ShowSite />
      </SiteDataProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/site: DentNow \/ clinics: 1/)).toBeInTheDocument(),
    );
  });

  it('shows an explicit error state when the API fails (no hardcoded fallback)', async () => {
    server.use(
      http.get('/api/v1/public/bootstrap', () => new HttpResponse(null, { status: 503 })),
    );
    render(
      <SiteDataProvider client={noRetryClient()}>
        <ShowSite />
      </SiteDataProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/Conținut indisponibil/)).toBeInTheDocument(),
    );
    // No clinic content leaked into the error screen.
    expect(screen.queryByText(/Dristor/)).not.toBeInTheDocument();
  });
});
