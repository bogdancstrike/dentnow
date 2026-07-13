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
  const initialConsent = useRef(analyticsConsent());
  const [consent, setConsentState] = useState(initialConsent.current);
  const coordinates = useRef<BrowserCoordinates | null>(null);
  const [initialLocationReady, setInitialLocationReady] = useState(
    initialConsent.current !== 'granted',
  );
  const initialReferrer = useRef(document.referrer || undefined);

  useEffect(() => {
    const update = () => setConsentState(analyticsConsent());
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  useEffect(() => {
    if (consent !== 'granted') {
      coordinates.current = null;
      return;
    }
    let active = true;
    void requestBrowserCoordinates().then((value) => {
      if (!active) return;
      coordinates.current = value;
      setInitialLocationReady(true);
      if (initialConsent.current !== 'granted' && value) {
        void sendAnalyticsEvent(
          { event_type: 'navigation_click', path: window.location.pathname, target_type: 'page', target_key: 'consent_granted' },
          value
        );
      }
    });
    return () => { active = false; };
  }, [consent]);

  useEffect(() => {
    if (!config.analyticsEnabled || !initialLocationReady) return;
    const path = location.pathname;
    const emit = (event: AnalyticsEventPayload) => void sendAnalyticsEvent(event, coordinates.current);
    emit({ event_type: 'page_view', path, target_type: 'page', target_key: path, referrer: initialReferrer.current });
    const typed = routeEvent(path);
    if (typed && typed.event_type !== 'article_read') emit({ ...typed, path });

    const articleTimer = typed?.event_type === 'article_read'
      ? window.setTimeout(() => emit({ ...typed, path, engaged_seconds: 15 }), 15_000)
      : undefined;
    const observed = new Set<string>();
    const analyticsSelector = 'main section[id], main [data-analytics-section], main [data-analytics-type][data-analytics-key]';
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
    const observeAnalyticsElements = () => {
      document.querySelectorAll<HTMLElement>(analyticsSelector).forEach((element) => sectionObserver?.observe(element));
    };
    observeAnalyticsElements();
    const mutationObserver = sectionObserver && 'MutationObserver' in window
      ? new MutationObserver(observeAnalyticsElements)
      : null;
    mutationObserver?.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>('a,button');
      if (!element) return;
      const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') ?? '' : '';
      const label = (element.dataset.analyticsLabel || element.textContent || href).trim().slice(0, 160);
      const isContact = /^(tel:|mailto:)/.test(href) || /wa\.me|whatsapp/i.test(href) || element.dataset.analyticsCta === 'contact';
      if (isContact) {
        const kind = href.startsWith('tel:') ? 'telefon' : href.startsWith('mailto:') ? 'email' : /whatsapp|wa\.me/i.test(href) ? 'whatsapp' : label;
        emit({ event_type: 'contact_cta', path, target_type: 'contact', target_key: kind });
      } else {
        emit({ event_type: 'navigation_click', path, target_type: 'page', target_key: href || label });
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => {
      if (articleTimer) window.clearTimeout(articleTimer);
      mutationObserver?.disconnect();
      sectionObserver?.disconnect();
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, [config.analyticsEnabled, initialLocationReady, location.pathname]);

  if (!config.analyticsEnabled || config.analyticsRequireConsent === false || consent !== null) return null;
  return (
    <aside className="analytics-consent" aria-label="Preferințe analiză trafic">
      <div>
        <strong>Ne ajuți să îmbunătățim experiența?</strong>
        <p>Colectăm date tehnice despre vizită, inclusiv adresa IP, user-agentul și o localizare aproximativă derivată din IP. Cu acordul tău putem folosi separat localizarea mai precisă permisă de browser.</p>
        <Link to="/confidentialitate">Detalii despre confidențialitate</Link>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" onClick={() => setAnalyticsConsent('denied')}>Doar necesare</button>
        <button type="button" className="analytics-consent__accept" onClick={() => setAnalyticsConsent('granted')}>Accept analytics</button>
      </div>
    </aside>
  );
}
