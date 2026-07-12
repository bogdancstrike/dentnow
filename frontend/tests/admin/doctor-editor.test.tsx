import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { DoctorEditorScreen } from '../../src/admin/features/doctors/DoctorEditorScreen';

describe('DoctorEditorScreen', () => {
  it('collects rich profile copy and three professional photographs for a new doctor', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/admin/echipa-medicala/nou']}>
        <ConfigProvider>
          <AntApp>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route path="/admin/echipa-medicala/nou" element={<DoctorEditorScreen client={new AdminClient(async () => 'token')} />} />
              </Routes>
            </QueryClientProvider>
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Nume și Prenume')).toBeInTheDocument();
    expect(screen.getByLabelText('Descriere completă')).toBeInTheDocument();
    expect(screen.getByLabelText('Abordare medicală')).toBeInTheDocument();
    expect(screen.getAllByText('Fotografie în cabinet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fotografie profesională').length).toBeGreaterThan(0);
  });
});
