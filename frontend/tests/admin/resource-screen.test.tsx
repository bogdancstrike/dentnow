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
  it('renders the offers list from the admin API', async () => {
    server.use(
      http.get('/api/v1/admin/offers', () =>
        HttpResponse.json({
          items: [{ id: 'o1', version: 1, slug: 'implant', name: 'Implant Promo', status: 'active' }],
          total: 1,
        }),
      ),
    );
    renderKey('offers');
    await waitFor(() => expect(screen.getByText('Implant Promo')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Adaugă' })).toBeInTheDocument();
  });

  it('maps generic resource keys to a screen and leaves dedicated/removed modules out', () => {
    for (const key of ['partners', 'doctors', 'legal', 'treatments']) {
      expect(screenForKey(key, new AdminClient(async () => 't'), ME)).not.toBeNull();
    }
    expect(screenForKey('articles', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('reviews', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('pages', new AdminClient(async () => 't'), ME)).toBeNull();
    expect(screenForKey('does-not-exist', new AdminClient(async () => 't'), ME)).toBeNull();
  });
});
