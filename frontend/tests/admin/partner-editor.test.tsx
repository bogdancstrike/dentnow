import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { PartnerEditorScreen } from '../../src/admin/features/partners/PartnerEditorScreen';

describe('PartnerEditorScreen', () => {
  it('authors the complete partner card and previews an unsaved partner on the real page', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/admin/parteneri/nou']}>
        <ConfigProvider>
          <AntApp>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route
                  path="/admin/parteneri/nou"
                  element={<PartnerEditorScreen client={new AdminClient(async () => 'token')} />}
                />
              </Routes>
            </QueryClientProvider>
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Nume partener')).toBeInTheDocument();
    expect(screen.getByLabelText('Logo partener')).toHaveAttribute('type', 'file');
    expect(screen.getByLabelText('Drepturi de utilizare')).toBeInTheDocument();
    expect(screen.getByLabelText('Website partener')).toBeInTheDocument();
    expect(screen.getByLabelText('Vizibil pe site')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordine')).toBeInTheDocument();
    expect(screen.getByTitle('Previzualizare live a paginii publice')).toHaveAttribute(
      'src', expect.stringContaining('/parteneri?preview=1'),
    );
    expect(screen.queryByText(/în curând/i)).not.toBeInTheDocument();
  });
});
