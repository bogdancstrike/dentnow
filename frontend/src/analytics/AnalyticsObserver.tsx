import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getRuntimeConfig } from '../config/runtime';
import {
  ANALYTICS_CONSENT_EVENT,
  analyticsConsent,
  requestBrowserCoordinates,
  sendAnalyticsEvent,
  setAnalyticsConsent,
  type AnalyticsEventPayload,
  type BrowserCoordinates,
} from './analyticsClient';
import './analytics.css';

function routeEvent(path: string): Pick<AnalyticsEventPayload, 'event_type' | 'target_type' | 'target_key'> | null {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'articole' && parts[1]) return { event_type: 'article_read', target_type: 'article', target_key: parts[1] };
  if (parts[0] === 'tratamente' && parts[1]) return { event_type: 'treatment_view', target_type: 'treatment', target_key: parts[1] };
  if (parts[0] === 'oferte' && parts[1]) return { event_type: 'offer_view', target_type: 'offer', target_key: parts[1] };
  if (parts[0] === 'locatii' && parts[1]) return { event_type: 'clinic_view', target_type: 'clinic', target_key: parts[1] };
  return null;
}

export function AnalyticsObserver() {
  const location = useLocation();
  const config = getRuntimeConfig();
  const [consent, setConsentState] = useState(analyticsConsent());
  // undefined = browser permission still pending, null = unavailable/refused.
  const [coordinates, setCoordinates] = useState<BrowserCoordinates | null | undefined>(
    config.analyticsRequireConsent === false ? null : undefined,
  );
  const initialReferrer = useRef(document.referrer || undefined);

  useEffect(() => {
    const update = () => setConsentState(analyticsConsent());
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  useEffect(() => {
    if (consent !== 'granted' || coordinates !== undefined) return;
    void requestBrowserCoordinates().then(setCoordinates);
  }, [consent, coordinates]);

  useEffect(() => {
    const allowed = config.analyticsEnabled && (config.analyticsRequireConsent === false || consent === 'granted');
    if (!allowed || (config.analyticsRequireConsent !== false && coordinates === undefined)) return;
    const path = location.pathname;
    const emit = (event: AnalyticsEventPayload) => void sendAnalyticsEvent(event, coordinates ?? null);
    emit({ event_type: 'page_view', path, target_type: 'page', target_key: path, referrer: initialReferrer.current });
    const typed = routeEvent(path);
    if (typed && typed.event_type !== 'article_read') emit({ ...typed, path });

    const articleTimer = typed?.event_type === 'article_read'
      ? window.setTimeout(() => emit({ ...typed, path, engaged_seconds: 15 }), 15_000)
      : undefined;
    const observed = new Set<string>();
    const sectionObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const id = element.id;
        const itemType = element.dataset.analyticsType;
        const itemKey = element.dataset.analyticsKey;
        const observationKey = itemType && itemKey ? `${itemType}:${itemKey}` : `section:${id}`;
        if (!entry.isIntersecting || observed.has(observationKey)) return;
        observed.add(observationKey);
        if (itemKey && itemType === 'offer') {
          emit({ event_type: 'offer_view', path, target_type: 'offer', target_key: itemKey });
        } else if (itemKey && itemType === 'treatment') {
          emit({ event_type: 'treatment_view', path, target_type: 'treatment', target_key: itemKey });
        } else if (itemKey && itemType === 'clinic') {
          emit({ event_type: 'clinic_view', path, target_type: 'clinic', target_key: itemKey });
        } else if (id) {
          emit({ event_type: 'section_view', path, target_type: 'section', target_key: id, section_id: id });
        }
      });
    }, { threshold: 0.55 }) : null;
    document.querySelectorAll<HTMLElement>('main section[id], main [data-analytics-section], main [data-analytics-type][data-analytics-key]').forEach((element) => sectionObserver?.observe(element));

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>('a,button');
      if (!element) return;
      const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') ?? '' : '';
      const label = (element.dataset.analyticsLabel || element.textContent || href).trim().slice(0, 160);
      const isContact = /^(tel:|mailto:)/.test(href) || /wa\.me|whatsapp/i.test(href) || element.dataset.analyticsCta === 'contact';
      if (isContact) {
        const kind = href.startsWith('tel:') ? 'telefon' : href.startsWith('mailto:') ? 'email' : /whatsapp|wa\.me/i.test(href) ? 'whatsapp' : label;
        emit({ event_type: 'contact_cta', path, target_type: 'contact', target_key: kind });
      } else if (element.closest('nav,header,footer') || element.dataset.analyticsNav) {
        emit({ event_type: 'navigation_click', path, target_type: 'page', target_key: href || label });
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => {
      if (articleTimer) window.clearTimeout(articleTimer);
      sectionObserver?.disconnect();
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, [config.analyticsEnabled, config.analyticsRequireConsent, consent, coordinates, location.pathname]);

  if (!config.analyticsEnabled || config.analyticsRequireConsent === false || consent !== null) return null;
  return (
    <aside className="analytics-consent" aria-label="Preferințe analiză trafic">
      <div>
        <strong>Ne ajuți să îmbunătățim experiența?</strong>
        <p>Putem măsura utilizarea site-ului și, cu permisiunea browserului, zona geografică. Datele au retenție limitată.</p>
        <Link to="/confidentialitate">Detalii despre confidențialitate</Link>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" onClick={() => setAnalyticsConsent('denied')}>Doar necesare</button>
        <button type="button" className="analytics-consent__accept" onClick={() => setAnalyticsConsent('granted')}>Accept analytics</button>
      </div>
    </aside>
  );
}
