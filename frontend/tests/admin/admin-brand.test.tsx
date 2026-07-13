import { App, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import type { Me } from '../../src/admin/auth/permissions';
import { AdminLayout } from '../../src/admin/layout/AdminLayout';

const ME: Me = {
  subject: 'admin',
  roles: ['dentnow_admin'],
  capabilities: ['content:read', 'content:write', 'audit:read'],
  clinic_scopes: [],
  is_admin: true,
  is_clinic_scoped: false,
};

describe('admin sidebar brand', () => {
  it('uses the tooth favicon instead of the DN monogram', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <App>
            <MemoryRouter initialEntries={['/admin/unknown']}>
              <AdminLayout me={ME} client={new AdminClient(async () => 'token')} />
            </MemoryRouter>
          </App>
        </QueryClientProvider>
      </ConfigProvider>,
    );

    const logo = container.querySelector('img.admin-brand-mark');
    expect(logo).toHaveAttribute('src', '/favicon.svg');
    expect(container.querySelector('.admin-brand-mark')).not.toHaveTextContent('DN');
  });

  it.each(['/admin/media', '/admin/audit'])('returns 404 for the removed page %s', (path) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <App>
            <MemoryRouter initialEntries={[path]}>
              <AdminLayout me={ME} client={new AdminClient(async () => 'token')} />
            </MemoryRouter>
          </App>
        </QueryClientProvider>
      </ConfigProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Nu am găsit resursa căutată.' })).toBeInTheDocument();
  });
});
