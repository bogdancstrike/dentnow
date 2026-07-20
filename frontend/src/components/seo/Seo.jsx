import { useEffect } from 'react';
import { useOptionalSiteData } from '../../public-site/SiteDataProvider';
import { siteLink, siteLinkHref } from '../../lib/siteContent';

const EMPTY_LINKS = [];

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

export default function Seo({ title, description, path = '/', image = '/assets/dentnow/og-dentnow.png', jsonLd = null, noindex = false }) {
  const siteData = useOptionalSiteData();
  const siteName = siteData?.site?.site_name || '';
  const links = siteData?.links || EMPTY_LINKS;
  const websiteHref = siteLinkHref(siteLink(links, 'social', 'website')) || window.location.origin;

  useEffect(() => {
    const absoluteUrl = new URL(path, websiteHref).toString();
    const fullTitle = siteName && !title.includes(siteName) ? `${title} | ${siteName}` : title;
    const fullImageUrl = new URL(image, websiteHref).toString();

    document.title = fullTitle;

    // Standard Meta
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });

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
        item: websiteHref
      }
    ];

    let currentAcc = '';
    pathParts.forEach((part, idx) => {
      currentAcc += `/${part}`;
      const readableName = part
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: idx + 2,
        name: readableName,
        item: new URL(currentAcc, websiteHref).toString()
      });
    });

    // Page-level schemas are merged into the default graph so breadcrumbs
    // and clinic entities are kept on every page.
    const pageSchemas = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).map(
      // eslint-disable-next-line no-unused-vars
      ({ '@context': _ctx, ...schema }) => schema
    );

    const fullSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        ...pageSchemas,
        {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems
        },
        ...(siteData?.clinics || []).map((clinic) => {
          const phone = (clinic.contacts || []).find((contact) => contact.kind === 'phone');
          const email = (clinic.contacts || []).find((contact) => contact.kind === 'email') || siteLink(links, 'email');
          const schema = {
            '@type': 'Dentist',
            '@id': `${websiteHref}#clinic-${clinic.slug}`,
            name: clinic.name,
            url: new URL(`/locatii/${clinic.slug}`, websiteHref).toString(),
            telephone: phone?.normalized_value || phone?.display_value,
            email: email?.value || email?.display_value,
            image: fullImageUrl,
            address: {
              '@type': 'PostalAddress',
              streetAddress: clinic.address_full,
              addressLocality: 'București',
              addressRegion: 'București',
              addressCountry: 'RO'
            },
            hasMap: clinic.map_link_url,
            openingHoursSpecification: (clinic.hours || [])
              .filter((hours) => !hours.closed && hours.opens_at && hours.closes_at)
              .map((hours) => ({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: WEEKDAYS[hours.weekday],
                opens: hours.opens_at,
                closes: hours.closes_at,
              })),
            sameAs: links
              .filter((link) => link.kind === 'social' && link.label.toLowerCase() !== 'website')
              .map(siteLinkHref)
              .filter(Boolean),
          };
          if (clinic.latitude != null && clinic.longitude != null) {
            schema.geo = {
              '@type': 'GeoCoordinates',
              latitude: clinic.latitude,
              longitude: clinic.longitude,
            };
          }
          return schema;
        })
      ]
    };

    upsertJsonLd(fullSchema);
  }, [title, description, path, image, jsonLd, noindex, siteData, siteName, links, websiteHref]);

  return null;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
