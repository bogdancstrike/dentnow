import { getRuntimeConfig } from '../config/runtime';

export type AnalyticsEventType =
  | 'page_view' | 'navigation_click' | 'section_view' | 'article_read'
  | 'treatment_view' | 'offer_view' | 'clinic_view' | 'contact_cta';

export interface BrowserCoordinates {
  latitude: number;
  longitude: number;
  geo_accuracy_m: number;
}

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  path: string;
  target_type?: 'page' | 'section' | 'article' | 'treatment' | 'offer' | 'clinic' | 'contact';
  target_key?: string;
  section_id?: string;
  referrer?: string;
  engaged_seconds?: number;
}

export const ANALYTICS_CONSENT_KEY = 'dentnow_analytics_consent';
export const ANALYTICS_CONSENT_EVENT = 'dentnow:analytics-consent';

export function analyticsConsent(): 'granted' | 'denied' | null {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value: 'granted' | 'denied'): void {
  try { window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value); } catch { /* unavailable storage */ }
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

export function privacySignalEnabled(): boolean {
  const navigatorWithGpc = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === '1' || navigatorWithGpc.globalPrivacyControl === true;
}

export function requestBrowserCoordinates(): Promise<BrowserCoordinates | null> {
  if (typeof navigator.geolocation?.getCurrentPosition !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: Number(coords.latitude.toFixed(5)),
        longitude: Number(coords.longitude.toFixed(5)),
        geo_accuracy_m: Math.min(100000, Math.max(0, Math.round(coords.accuracy))),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export async function sendAnalyticsEvent(
  payload: AnalyticsEventPayload,
  coordinates: BrowserCoordinates | null,
): Promise<void> {
  const config = getRuntimeConfig();
  if (!config.analyticsEnabled || privacySignalEnabled()) return;
  const consent = analyticsConsent();
  const body = JSON.stringify({
    ...payload,
    ...(coordinates ?? {}),
    consent_granted: consent === 'granted',
  });
  try {
    await fetch(`${config.apiBase}/v1/public/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    });
  } catch {
    // Analytics must never degrade the public experience.
  }
}
