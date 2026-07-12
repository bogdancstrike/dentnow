import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClinicContacts } from '../../src/admin/features/clinics/ClinicSubResources';
import { AdminClient } from '../../src/admin/api/adminClient';
import { server } from '../msw/server';
import { __resetRuntimeConfigForTests, loadRuntimeConfig } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('clinic child resources', () => {
  it('shows contacts only for the clinic being edited', async () => {
    server.use(
      http.get('/api/v1/admin/clinic-contacts', () => HttpResponse.json({
        items: [
          { id: 'a', version: 1, clinic_id: 'clinic-a', kind: 'phone', display_value: '0700 A' },
          { id: 'b', version: 1, clinic_id: 'clinic-b', kind: 'phone', display_value: '0700 B' },
        ],
        total: 2,
      })),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ConfigProvider>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <ClinicContacts clinicId="clinic-a" client={new AdminClient(async () => 'token')} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>,
    );

    await waitFor(() => expect(screen.getByText('0700 A')).toBeInTheDocument());
    expect(screen.queryByText('0700 B')).not.toBeInTheDocument();
  });
});
