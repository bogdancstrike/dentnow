import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

vi.mock('../../src/admin/components/LivePreview', () => ({
  LivePreview: ({ path, draft }: { path: string; draft?: unknown }) => (
    <output
      data-testid="treatment-preview-props"
      data-path={path}
      data-draft={draft ? JSON.stringify(draft) : ''}
    />
  ),
}));

import { TreatmentEditorScreen } from '../../src/admin/features/treatments/TreatmentEditorScreen';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

function renderEditor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const client = new AdminClient(async () => 'token');
  return render(
    <ConfigProvider>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/admin/tratamente/nou']}>
            <Routes>
              <Route path="/admin/tratamente/nou" element={<TreatmentEditorScreen client={client} />} />
              <Route path="/admin/tratamente/:treatmentId" element={<TreatmentEditorScreen client={client} />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  );
}

describe('TreatmentEditorScreen', () => {
  it('waits for a name and previews the draft on the treatments index', async () => {
    let submitted: Record<string, unknown> | undefined;
    server.use(
      http.get('/api/v1/admin/treatment-categories', () => HttpResponse.json({ items: [], total: 0 })),
      http.post('/api/v1/admin/treatments', async ({ request }) => {
        submitted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'treatment-created',
          version: 1,
          ...submitted,
        }, { status: 201 });
      }),
      http.get('/api/v1/admin/treatments/treatment-created', () => HttpResponse.json({
        id: 'treatment-created', version: 1, name: 'Implant Dentar Premium',
        slug: 'implant-dentar-premium', detail_markdown: '## Detalii', active: true,
      })),
    );
    renderEditor();
    const user = userEvent.setup();
    const preview = screen.getByTestId('treatment-preview-props');

    expect(preview).toHaveAttribute('data-draft', '');

    await user.click(screen.getByRole('button', { name: /Precompletează/ }));
    await waitFor(() => expect(preview).toHaveAttribute('data-path', '/tratamente'));
    expect(JSON.parse(preview.getAttribute('data-draft') || '{}').data.name).toBe('Implant Dentar Premium');

    fireEvent.click(screen.getByRole('button', { name: /Salvează/ }));
    await waitFor(() => expect(submitted).toBeDefined());
    expect(submitted?.name).toBe('Implant Dentar Premium');
  });
});
