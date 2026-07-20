import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { getResourceConfig, screenForKey } from '../../src/admin/features/registry';
import { ResourceScreen } from '../../src/admin/components/ResourceScreen';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';
import type { Me } from '../../src/admin/auth/permissions';

vi.mock('../../src/admin/components/LivePreview', () => ({
  LivePreview: ({ path, draft }: { path: string | null; draft?: unknown }) => (
    <output data-testid="resource-live-preview" data-path={path} data-draft={JSON.stringify(draft)} />
  ),
}));

import { ResourceEditorScreen } from '../../src/admin/components/ResourceEditorScreen';

const ME: Me = {
  subject: 'admin', roles: ['dentnow_admin'], capabilities: ['content:read', 'content:write'],
  clinic_scopes: [], is_admin: true, is_clinic_scoped: false,
};

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('generic ResourceScreen via registry', () => {
  it('renders a generic resource list (news) from the admin API', async () => {
    server.use(
      http.get('/api/v1/admin/news', () =>
        HttpResponse.json({
          items: [{ id: 'n1', version: 1, slug: 'eveniment', title: 'Eveniment Nou', status: 'published' }],
          total: 1,
        }),
      ),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const client = new AdminClient(async () => 'token');
    render(
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <QueryClientProvider client={qc}>
              <ResourceScreen client={client} config={getResourceConfig('news')!} basePath="/admin/noutati" />
            </QueryClientProvider>
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Eveniment Nou')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Adaugă' })).toBeInTheDocument();
    expect(screen.getByText('Glisează orizontal pentru a vedea toate coloanele.')).toBeInTheDocument();
  });

  it('getResourceConfig returns configs for generic keys only', () => {
    for (const key of ['legal', 'quiz', 'news', 'reviews', 'homepage-services', 'technologies', 'ebooks', 'gallery']) {
      expect(getResourceConfig(key)).not.toBeNull();
    }
    for (const key of ['clinics', 'treatments', 'offers', 'doctors', 'partners', 'articles', 'settings', 'nope']) {
      expect(getResourceConfig(key)).toBeNull();
    }
  });

  it('screenForKey has no bespoke generic pages', () => {
    expect(screenForKey('settings', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('news', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('clinics', new AdminClient(async () => 't'), ME)).toBeNull();
  });

  it('configures SEO page edits as an unsaved live preview', () => {
    const config = getResourceConfig('page-seo');
    expect(config?.previewKind).toBe('page-seo');
    expect(config?.previewAlwaysDraft).toBe(true);
    expect(config?.previewPath?.(null, { __preview_path: '/tratamente' })).toBe('/tratamente');
    expect(config?.toPreviewDraft?.({
      __preview_path: '/tratamente',
      title: 'Titlu SEO nesalvat',
      description: 'Descriere nesalvată',
      structured_data_json: '{"@type":"WebPage"}',
    }, null)).toEqual({
      path: '/tratamente',
      seo: {
        title: 'Titlu SEO nesalvat',
        description: 'Descriere nesalvată',
        structured_data: { '@type': 'WebPage' },
      },
    });
  });

  it('configures page section edits as an unsaved live preview', () => {
    const config = getResourceConfig('page-sections');
    expect(config?.previewKind).toBe('page-section');
    expect(config?.previewAlwaysDraft).toBe(true);
    expect(config?.previewPath?.(null, { __preview_path: '/' })).toBe('/');
    expect(config?.toPreviewDraft?.({
      __preview_path: '/', block_type: 'home_hero', position: 0,
      payload_json: '{"title":"Titlu nesalvat"}',
    }, null)).toEqual({
      path: '/',
      section: {
        block_type: 'home_hero',
        position: 0,
        payload: { title: 'Titlu nesalvat' },
      },
    });
  });

  it('resolves the public page and streams unsaved SEO form values without saving', async () => {
    server.use(
      http.get('/api/v1/admin/page-seo/seo-1', () => HttpResponse.json({
        id: 'seo-1', version: 2, page_id: 'page-1', title: 'Titlu salvat',
        description: 'Descriere salvată', canonical_path: '/tratamente', structured_data: null,
      })),
      http.get('/api/v1/admin/pages', () => HttpResponse.json({
        items: [{ id: 'page-1', title: 'Tratamente', path: '/tratamente' }], total: 1,
      })),
    );
    const client = new AdminClient(async () => 'token');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/admin/seo-pagini/seo-1']}>
        <ConfigProvider>
          <AntApp>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route path="/admin/seo-pagini/:id" element={(
                  <ResourceEditorScreen
                    client={client}
                    config={getResourceConfig('page-seo')!}
                    basePath="/admin/seo-pagini"
                  />
                )} />
              </Routes>
            </QueryClientProvider>
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>,
    );

    const preview = await screen.findByTestId('resource-live-preview');
    await waitFor(() => expect(preview).toHaveAttribute('data-path', '/tratamente'));
    fireEvent.change(screen.getByLabelText('Titlu SEO'), { target: { value: 'Titlu nesalvat' } });
    await waitFor(() => expect(JSON.parse(preview.getAttribute('data-draft') || '{}')).toMatchObject({
      kind: 'page-seo',
      data: { path: '/tratamente', seo: { title: 'Titlu nesalvat' } },
    }));
  });
});
