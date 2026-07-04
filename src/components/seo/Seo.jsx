import { useEffect } from 'react';
import config from '../../config';

const siteName = 'DentNow';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data) {
  const id = 'dentnow-jsonld';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo({ title, description, path = '/', image = '/assets/dentnow/og-dentnow.svg', jsonLd }) {
  useEffect(() => {
    const absoluteUrl = new URL(path, config.social.website).toString();
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: absoluteUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: new URL(image, config.social.website).toString() });
    upsertCanonical(absoluteUrl);

    upsertJsonLd(jsonLd || {
      '@context': 'https://schema.org',
      '@graph': config.locations.map((loc, i) => ({
        '@type': 'Dentist',
        '@id': `${config.social.website}#clinic-${i}`,
        name: loc.name,
        url: config.social.website,
        telephone: loc.phone,
        email: config.email,
        image: new URL(image, config.social.website).toString(),
        address: {
          '@type': 'PostalAddress',
          streetAddress: loc.address,
          addressLocality: 'Bucuresti',
          addressCountry: 'RO',
        },
        hasMap: loc.mapsLink,
        openingHours: ['Mo-Fr 09:00-19:00', 'Sa 09:00-15:00'],
        sameAs: [config.social.facebook, config.social.instagram].filter(Boolean),
      })),
    });
  }, [title, description, path, image, jsonLd]);

  return null;
}
