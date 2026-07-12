import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { ClinicsScreen } from '../../src/admin/features/clinics/ClinicsScreen';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const client = new AdminClient(async () => 'token');
  return render(
    <ConfigProvider>
      <AntApp>
        <QueryClientProvider client={qc}>
          <ClinicsScreen client={client} />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  );
}

describe('ClinicsScreen', () => {
  it('renders clinics from the admin API', async () => {
    server.use(
      http.get('/api/v1/admin/clinics', () =>
        HttpResponse.json({
          items: [
            { id: 'c1', version: 1, slug: 'dristor', name: 'DentNow Dristor', area: 'Dristor', address_full: null, status: 'active' },
          ],
          total: 1,
        }),
      ),
    );
    renderScreen();
    await waitFor(() => expect(screen.getByText('DentNow Dristor')).toBeInTheDocument());
    expect(screen.getByText('dristor')).toBeInTheDocument();
    // create action is available
    expect(screen.getByRole('button', { name: 'Adaugă' })).toBeInTheDocument();
  });
});
