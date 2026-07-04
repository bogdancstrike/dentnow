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

function upsertHreflang(lang, href) {
  let el = document.head.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', lang);
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
    const fullImageUrl = new URL(image, config.social.website).toString();

    document.title = fullTitle;

    // Standard Meta
    upsertMeta('meta[name="description"]', { name: 'description', content: description });

    // OpenGraph Meta
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: absoluteUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: fullImageUrl });

    // Twitter Card Meta
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: fullImageUrl });

    // Canonical
    upsertCanonical(absoluteUrl);

    // Hreflang annotations (Item 7)
    upsertHreflang('ro-RO', absoluteUrl);
    upsertHreflang('ro', absoluteUrl);
    upsertHreflang('x-default', absoluteUrl);

    // Build default Breadcrumb schema
    const pathParts = path.split('/').filter(Boolean);
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Acasă',
        item: config.social.website
      }
    ];

    let currentAcc = '';
    pathParts.forEach((part, idx) => {
      currentAcc += `/${part}`;
      const readableName = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: idx + 2,
        name: readableName,
        item: new URL(currentAcc, config.social.website).toString()
      });
    });

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems
        },
        ...config.locations.map((loc, i) => ({
          '@type': 'Dentist',
          '@id': `${config.social.website}#clinic-${i}`,
          name: loc.name,
          url: config.social.website,
          telephone: loc.phone,
          email: config.email,
          image: fullImageUrl,
          priceRange: '$$',
          address: {
            '@type': 'PostalAddress',
            streetAddress: loc.address,
            addressLocality: 'București',
            addressRegion: 'București',
            addressCountry: 'RO'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: loc.area.includes('Dristor') ? 44.4136318 : loc.area.includes('Ghencea') ? 44.4055 : 44.4180,
            longitude: loc.area.includes('Dristor') ? 26.1408659 : loc.area.includes('Ghencea') ? 26.0020 : 26.1450
          },
          hasMap: loc.mapsLink,
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '19:00'
            },
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: 'Saturday',
              opens: '09:00',
              closes: '15:00'
            }
          ],
          sameAs: [config.social.facebook, config.social.instagram, config.social.linkedin].filter(Boolean)
        }))
      ]
    };

    upsertJsonLd(jsonLd || defaultSchema);
  }, [title, description, path, image, jsonLd]);

  return null;
}
