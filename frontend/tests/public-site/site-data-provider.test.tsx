import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
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

function ShowPageSeo() {
  const data = useSiteData();
  return <div>seo: {data.pages['/tratamente']?.seo?.title || 'lipsește'}</div>;
}

function ShowPageSection() {
  const data = useSiteData();
  const hero = data.pages['/']?.sections.find((section) => section.block_type === 'home_hero');
  return <div>hero: {String(hero?.payload.title || 'lipsește')}</div>;
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
      expect(screen.getByText('503')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Serviciul nu este disponibil/)).toBeInTheDocument();
    // No clinic content leaked into the error screen.
    expect(screen.queryByText(/Dristor/)).not.toBeInTheDocument();
  });

  it('merges an unsaved SEO draft into only the previewed public page', async () => {
    window.history.replaceState({}, '', '/tratamente?preview=1');
    server.use(
      http.get('/api/v1/public/bootstrap', () => HttpResponse.json({
        ...BOOTSTRAP,
        pages: {
          '/tratamente': {
            path: '/tratamente', route_key: 'tratamente', template_key: 'treatment-index',
            title: 'Tratamente', indexable: true, sections: [], seo: { title: 'Titlu salvat' },
          },
        },
      })),
    );
    render(
      <SiteDataProvider client={noRetryClient()}>
        <ShowPageSeo />
      </SiteDataProvider>,
    );
    await screen.findByText('seo: Titlu salvat');

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin,
        source: window,
        data: {
          type: 'dentnow:preview-draft',
          kind: 'page-seo',
          data: { path: '/tratamente', seo: { title: 'Titlu nesalvat' } },
        },
      }));
    });

    await screen.findByText('seo: Titlu nesalvat');
  });

  it('merges an unsaved section draft into the previewed public page', async () => {
    window.history.replaceState({}, '', '/?preview=1');
    server.use(
      http.get('/api/v1/public/bootstrap', () => HttpResponse.json({
        ...BOOTSTRAP,
        pages: {
          '/': {
            path: '/', route_key: 'home', template_key: 'home', title: 'Acasă',
            indexable: true, seo: null,
            sections: [{ block_type: 'home_hero', position: 0, payload: { title: 'Titlu salvat' } }],
          },
        },
      })),
    );
    render(
      <SiteDataProvider client={noRetryClient()}>
        <ShowPageSection />
      </SiteDataProvider>,
    );
    await screen.findByText('hero: Titlu salvat');

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin,
        source: window,
        data: {
          type: 'dentnow:preview-draft',
          kind: 'page-section',
          data: {
            path: '/',
            section: {
              block_type: 'home_hero', position: 0, __preview_position: 0,
              payload: { title: 'Titlu nesalvat' },
            },
          },
        },
      }));
    });

    await screen.findByText('hero: Titlu nesalvat');
  });
});
