import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { OfferEditorScreen } from '../../src/admin/features/offers/OfferEditorScreen';

describe('OfferEditorScreen', () => {
  it('uses searchable existing-resource selectors for treatments and clinics', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/admin/oferte/nou']}>
        <ConfigProvider>
          <AntApp>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route
                  path="/admin/oferte/nou"
                  element={<OfferEditorScreen client={new AdminClient(async () => 'token')} />}
                />
              </Routes>
            </QueryClientProvider>
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Tratamente incluse')).toHaveAttribute('role', 'combobox');
    expect(screen.getByLabelText('Clinici participante')).toHaveAttribute('role', 'combobox');
    expect(screen.getByText('Lasă lista goală dacă oferta este generală.')).toBeInTheDocument();
  });
});
