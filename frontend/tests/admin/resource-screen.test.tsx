import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { screenForKey } from '../../src/admin/features/registry';
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

function renderKey(key: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const client = new AdminClient(async () => 'token');
  return render(
    <ConfigProvider>
      <AntApp>
        <QueryClientProvider client={qc}>{screenForKey(key, client, ME)}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  );
}

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
    renderKey('news');
    await waitFor(() => expect(screen.getByText('Eveniment Nou')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Adaugă' })).toBeInTheDocument();
  });

  it('maps only generic keys to a screen; dedicated full-page editors route in AdminLayout', () => {
    // These stay on the generic ResourceScreen.
    for (const key of ['legal', 'quiz', 'news', 'settings']) {
      expect(screenForKey(key, new AdminClient(async () => 't'), ME)).not.toBeNull();
    }
    // These have dedicated screens/routes (or were removed), so screenForKey returns null.
    for (const key of [
      'clinics', 'treatments', 'offers', 'doctors', 'partners',
      'articles', 'reviews', 'pages', 'does-not-exist',
    ]) {
      expect(screenForKey(key, new AdminClient(async () => 't'), ME)).toBeNull();
    }
  });
});
