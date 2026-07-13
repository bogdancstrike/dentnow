import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/publicClient', () => ({
  publicQueryKeys: { reviews: ['public', 'reviews'] },
  fetchReviews: async () => [{
    id: 'saved-review', author: 'Autor salvat', text_body: 'Text salvat', rating: 5, position: 0,
  }],
}));
vi.mock('../../src/api/previewDraft', () => ({
  usePreviewDraft: () => ({
    author: 'Autor nesalvat', text_body: 'Text nesalvat în preview', rating: 4,
    position: 0, __preview_position: 0,
  }),
}));

import Recenzii from '../../src/pages/Recenzii';

describe('public reviews', () => {
  it('replaces the edited card with the unsaved draft and renders its exact star count', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Recenzii />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Text nesalvat în preview/)).toBeInTheDocument();
    expect(screen.getByText('Autor nesalvat')).toBeInTheDocument();
    expect(screen.getByLabelText('4 din 5 stele')).toHaveTextContent('★★★★☆');
    expect(screen.queryByText(/Text salvat/)).not.toBeInTheDocument();
  });
});
