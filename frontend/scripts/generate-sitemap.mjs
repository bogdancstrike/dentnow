import fs from 'fs';
import path from 'path';

const domain = 'https://www.dentnow.ro';
const currentDate = new Date().toISOString().split('T')[0];

// 1. Static core routes & landing pages
const routes = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/tratamente', priority: '0.9', changefreq: 'weekly' },
  { url: '/oferte', priority: '0.8', changefreq: 'weekly' },
  { url: '/recenzii', priority: '0.7', changefreq: 'weekly' },
  { url: '/before-after', priority: '0.7', changefreq: 'monthly' },
  { url: '/noutati', priority: '0.7', changefreq: 'weekly' },
  { url: '/scor-igiena', priority: '0.7', changefreq: 'monthly' },
  { url: '/parteneri', priority: '0.6', changefreq: 'monthly' },
  { url: '/ebook', priority: '0.6', changefreq: 'monthly' },
  { url: '/articole', priority: '0.8', changefreq: 'weekly' },

  // Clinic-specific URLs are supplied by the published backend data, never compiled
  // into this static list. Individual treatments intentionally live on /tratamente.

  // Emergency & CAS hub pages
  { url: '/urgente-dentare-bucuresti', priority: '0.9', changefreq: 'weekly' },
  { url: '/decontat-cas', priority: '0.8', changefreq: 'weekly' },

  // Legal
  { url: '/gdpr', priority: '0.3', changefreq: 'yearly' },
  { url: '/confidentialitate', priority: '0.3', changefreq: 'yearly' },
  { url: '/termeni', priority: '0.3', changefreq: 'yearly' }
];

// 2. Read articles from API (skipped for now in static build)
// TODO: Fetch from /api/v1/public/articles during build

// Build XML string
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${routes
  .map(
    (r) => `  <url>
    <loc>${domain}${r.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const outputPath = path.resolve('./public/sitemap.xml');
fs.writeFileSync(outputPath, xmlContent, 'utf-8');
console.log(`Generated sitemap.xml with ${routes.length} URLs at ${outputPath}`);
