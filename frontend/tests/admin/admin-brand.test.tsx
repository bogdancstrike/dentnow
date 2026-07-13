import { App, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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

  it('replaces the sidebar with a navigation drawer on phone and fold widths', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
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

      expect(container.querySelector('.admin-sidebar')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Deschide meniul' }));
      expect(await screen.findByText('Vezi site-ul public')).toBeInTheDocument();
      expect(document.querySelector('.admin-navigation-menu')).toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('uses the compact sidebar on tablet and small laptop widths', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(min-width: 768px) and (max-width: 1199px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
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

      expect(container.querySelector('.admin-sidebar')).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Extinde meniul' })).toBeInTheDocument();
      expect(screen.queryByText('Content operations')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
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
