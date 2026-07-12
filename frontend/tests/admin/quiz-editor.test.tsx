import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuizSubResources } from '../../src/admin/features/quiz/QuizSubResources';
import { AdminClient } from '../../src/admin/api/adminClient';
import { server } from '../msw/server';
import { __resetRuntimeConfigForTests, loadRuntimeConfig } from '../../src/config/runtime';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('QuizSubResources', () => {
  it('renders only the selected quiz questions, answers, and result bands', async () => {
    server.use(
      http.get('/api/v1/admin/quiz-questions', () => HttpResponse.json({ items: [
        { id: 'q1', version: 1, quiz_id: 'quiz-a', prompt: 'Cât de des te periezi?', position: 0 },
        { id: 'q2', version: 1, quiz_id: 'quiz-b', prompt: 'Întrebare străină', position: 0 },
      ] })),
      http.get('/api/v1/admin/quiz-options', () => HttpResponse.json({ items: [
        { id: 'o1', version: 1, question_id: 'q1', label: 'De două ori', score: 4, position: 0 },
        { id: 'o2', version: 1, question_id: 'q2', label: 'Răspuns străin', score: 0, position: 0 },
      ] })),
      http.get('/api/v1/admin/quiz-result-bands', () => HttpResponse.json({ items: [
        { id: 'b1', version: 1, quiz_id: 'quiz-a', min_score: 0, max_score: 10, title: 'Mai este de lucru' },
        { id: 'b2', version: 1, quiz_id: 'quiz-b', min_score: 0, max_score: 10, title: 'Rezultat străin' },
      ] })),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ConfigProvider>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <QuizSubResources quizId="quiz-a" client={new AdminClient(async () => 'token')} onChanged={() => undefined} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>,
    );

    await waitFor(() => expect(screen.getAllByText('Cât de des te periezi?')).toHaveLength(2));
    expect(screen.getByText('De două ori')).toBeInTheDocument();
    expect(screen.getByText('Mai este de lucru')).toBeInTheDocument();
    expect(screen.queryByText('Întrebare străină')).not.toBeInTheDocument();
    expect(screen.queryByText('Răspuns străin')).not.toBeInTheDocument();
    expect(screen.queryByText('Rezultat străin')).not.toBeInTheDocument();
  });
});
