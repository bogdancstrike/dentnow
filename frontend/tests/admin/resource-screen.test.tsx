import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { getResourceConfig, screenForKey } from '../../src/admin/features/registry';
import { ResourceScreen } from '../../src/admin/components/ResourceScreen';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';
import type { Me } from '../../src/admin/auth/permissions';

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
  });

  it('getResourceConfig returns configs for generic keys only', () => {
    for (const key of ['legal', 'quiz', 'news', 'homepage-services', 'gallery']) {
      expect(getResourceConfig(key)).not.toBeNull();
    }
    for (const key of ['clinics', 'treatments', 'offers', 'doctors', 'partners', 'articles', 'settings', 'nope']) {
      expect(getResourceConfig(key)).toBeNull();
    }
  });

  it('screenForKey only returns the bespoke settings screen', () => {
    expect(screenForKey('settings', new AdminClient(async () => 't'), ME)).not.toBeNull();
    expect(screenForKey('news', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('clinics', new AdminClient(async () => 't'), ME)).toBeNull();
  });
});
