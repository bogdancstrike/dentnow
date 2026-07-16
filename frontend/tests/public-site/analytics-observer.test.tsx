import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsObserver } from '../../src/analytics/AnalyticsObserver';
import { ANALYTICS_CONSENT_KEY } from '../../src/analytics/analyticsClient';
import { __resetRuntimeConfigForTests, loadRuntimeConfig } from '../../src/config/runtime';

const originalGeolocation = navigator.geolocation;

beforeEach(() => {
  __resetRuntimeConfigForTests();
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation,
  });
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

  it('starts without precise-location consent and sends consented subsequent events', async () => {
    await configure(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    render(
      <MemoryRouter initialEntries={['/tratamente/implant']}>
        <AnalyticsObserver />
        <button type="button" data-analytics-cta="contact">Solicită programare</button>
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Preferințe analiză trafic')).toBeInTheDocument();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body))).toEqual(expect.objectContaining({
      event_type: 'page_view', path: '/tratamente/implant', consent_granted: false,
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted');
    const eventsBeforeContact = fetchSpy.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Solicită programare' }));
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(eventsBeforeContact));
    const bodies = fetchSpy.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
    expect(bodies).toContainEqual(expect.objectContaining({
      event_type: 'contact_cta', path: '/tratamente/implant', consent_granted: true,
    }));
    expect(bodies.every((body) => body.ip === undefined && body.user_agent === undefined)).toBe(true);
  });

  it('persists a refusal while limited events continue', async () => {
    await configure(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    render(<MemoryRouter><AnalyticsObserver /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Doar necesare' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('denied');
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body));
    expect(body.consent_granted).toBe(false);
  });

  it('collects automatically without claiming consent or requesting browser coordinates', async () => {
    await configure(true, false);
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));

    render(<MemoryRouter initialEntries={['/noutati']}><AnalyticsObserver /></MemoryRouter>);

    expect(screen.queryByLabelText('Preferințe analiză trafic')).not.toBeInTheDocument();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    const body = JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body));
    expect(body).toEqual(expect.objectContaining({
      event_type: 'page_view',
      path: '/noutati',
      consent_granted: false,
    }));
  });

  it('never blocks events on geolocation and sends a coordinate ping once a fix arrives', async () => {
    await configure(true);
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    let deliverFix: (() => void) | undefined;
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      deliverFix = () => success({
        coords: { latitude: 44.42681, longitude: 26.10254, accuracy: 35 },
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));

    render(<MemoryRouter initialEntries={['/noutati']}><AnalyticsObserver /></MemoryRouter>);

    // The page_view must go out immediately, before the location prompt resolves.
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const first = JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body));
    expect(first).toEqual(expect.objectContaining({ event_type: 'page_view', path: '/noutati' }));
    expect(first.latitude).toBeUndefined();

    deliverFix?.();
    await waitFor(() => {
      const bodies = fetchSpy.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
      expect(bodies).toContainEqual(expect.objectContaining({
        event_type: 'navigation_click',
        latitude: 44.42681,
        longitude: 26.10254,
        consent_granted: true,
      }));
      const ping = bodies.find((body) => body.latitude !== undefined);
      expect(ping.target_key).toBeUndefined();
    });
  });

  it('tracks treatment rows that are rendered after the analytics observer mounts', async () => {
    await configure(true, false);
    class ImmediateIntersectionObserver {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(element: Element) {
        this.callback([{ isIntersecting: true, target: element } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '0px';
      thresholds = [0.55];
    }
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const { rerender } = render(
      <MemoryRouter initialEntries={['/tratamente']}>
        <AnalyticsObserver />
        <main />
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter initialEntries={['/tratamente']}>
        <AnalyticsObserver />
        <main><div data-analytics-type="treatment" data-analytics-key="implant-dentar" /></main>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const bodies = fetchSpy.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
      expect(bodies).toContainEqual(expect.objectContaining({
        event_type: 'treatment_view', target_type: 'treatment', target_key: 'implant-dentar',
      }));
    });
  });
});
