import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AdminClient } from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

vi.mock('../../src/admin/components/LivePreview', () => ({
  LivePreview: ({ path, draft }: { path: string | null; draft?: unknown }) => (
    <output data-testid="site-text-live-preview" data-path={path} data-draft={JSON.stringify(draft)} />
  ),
}));

import { SiteTextsScreen } from '../../src/admin/features/site-texts/SiteTextsScreen';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('SiteTextsScreen previews', () => {
  it('opens LivePreview at the text location with the unsaved value', async () => {
    server.use(
      http.get('/api/v1/admin/site-texts', () => HttpResponse.json({
        items: [{ id: 'text-1', version: 1, key: 'home.contact.title', value: 'Titlu publicat' }],
        total: 1,
      })),
    );
    const client = new AdminClient(async () => 'token');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ConfigProvider>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <SiteTextsScreen client={client} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>,
    );

    const label = await screen.findByText('Secțiune contact — titlu ({count} = nr. clinici)');
    const row = label.closest('.site-text-row');
    expect(row).not.toBeNull();
    const input = within(row as HTMLElement).getByDisplayValue('Titlu publicat');
    await userEvent.clear(input);
    await userEvent.type(input, 'Titlu nesalvat');
    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: /Preview/ }));

    const preview = await screen.findByTestId('site-text-live-preview');
    await waitFor(() => expect(preview).toHaveAttribute('data-path', '/#contact'));
    expect(preview.closest('.article-editor-preview-panel')).not.toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(JSON.parse(preview.getAttribute('data-draft') || '{}')).toEqual({
      kind: 'site-text',
      data: { key: 'home.contact.title', value: 'Titlu nesalvat' },
    });
  });
});
