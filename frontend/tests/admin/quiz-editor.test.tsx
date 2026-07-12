import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, Form } from 'antd';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AdminClient } from '../../src/admin/api/adminClient';
import { getResourceConfig } from '../../src/admin/features/registry';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('quiz admin editor', () => {
  it('keeps the parent fields and exposes nested authoring after the quiz is saved', () => {
    const config = getResourceConfig('quiz');
    expect(config?.editExtra).toBeTypeOf('function');
    expect(config?.editExtraHint).toMatch(/salvează mai întâi/i);

    render(
      <Form>
        {config?.form({ editing: null, client: new AdminClient(async () => 'token') })}
      </Form>,
    );

    expect(screen.getByLabelText('Titlu')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresă URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Intro')).toBeInTheDocument();
  });

  it('groups answers below each draggable question and adds responses from that question row', async () => {
    server.use(
      http.get('/api/v1/admin/quiz-questions', () => HttpResponse.json({
        items: [
          { id: 'q1', version: 1, quiz_id: 'quiz-1', prompt: 'Întrebarea unu', position: 0 },
          { id: 'q2', version: 1, quiz_id: 'quiz-1', prompt: 'Întrebarea doi', position: 1 },
        ],
      })),
      http.get('/api/v1/admin/quiz-options', () => HttpResponse.json({
        items: [
          { id: 'o1', version: 1, question_id: 'q1', label: 'Răspuns unu', score: 2, position: 0 },
        ],
      })),
      http.get('/api/v1/admin/quiz-result-bands', () => HttpResponse.json({ items: [] })),
    );
    const config = getResourceConfig('quiz');
    const client = new AdminClient(async () => 'token');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <ConfigProvider>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            {config?.editExtra?.({
              row: { id: 'quiz-1', version: 1 } as never,
              client,
              onChanged: vi.fn(),
            })}
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>,
    );

    expect(await screen.findByText('Răspuns unu')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Adaugă răspuns' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Reordonează Întrebarea unu' })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Adaugă răspuns' })[0]!);
    expect(await screen.findByText('Adaugă răspuns', { selector: '.ant-drawer-title' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Întrebare')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Textul răspunsului')).toBeInTheDocument();
  });
});
