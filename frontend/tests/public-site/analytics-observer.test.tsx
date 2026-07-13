import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsObserver } from '../../src/analytics/AnalyticsObserver';
import { ANALYTICS_CONSENT_KEY } from '../../src/analytics/analyticsClient';
import { __resetRuntimeConfigForTests, loadRuntimeConfig } from '../../src/config/runtime';

beforeEach(() => {
  __resetRuntimeConfigForTests();
  localStorage.clear();
  vi.restoreAllMocks();
});

async function configure(analyticsEnabled: boolean, analyticsRequireConsent = true) {
  await loadRuntimeConfig((async () => new Response(JSON.stringify({
    apiBase: '/api', analyticsEnabled, analyticsRequireConsent,
  }))) as typeof fetch);
}

describe('AnalyticsObserver', () => {
  it('does nothing when collection is disabled', async () => {
    await configure(false);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<MemoryRouter><AnalyticsObserver /></MemoryRouter>);
    expect(screen.queryByLabelText('Preferințe analiză trafic')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('asks for consent and then emits a query-free page view', async () => {
    await configure(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    render(<MemoryRouter initialEntries={['/tratamente/implant']}><AnalyticsObserver /></MemoryRouter>);
    expect(screen.getByLabelText('Preferințe analiză trafic')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted');
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const bodies = fetchSpy.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
    expect(bodies).toContainEqual(expect.objectContaining({
      event_type: 'page_view', path: '/tratamente/implant', consent_granted: true,
    }));
    expect(bodies.every((body) => body.ip === undefined && body.user_agent === undefined)).toBe(true);
  });

  it('persists a refusal without sending events', async () => {
    await configure(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<MemoryRouter><AnalyticsObserver /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Doar necesare' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('denied');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

