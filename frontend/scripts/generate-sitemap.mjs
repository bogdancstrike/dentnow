import fs from 'fs';
import path from 'path';

const domain = 'https://www.dentnow.ro';
const currentDate = new Date().toISOString().split('T')[0];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
  
  // Dedicated Location Pages
  { url: '/locatii/dristor', priority: '0.9', changefreq: 'weekly' },
  { url: '/locatii/baba-novac', priority: '0.9', changefreq: 'weekly' },
  { url: '/locatii/prelungirea-ghencea', priority: '0.9', changefreq: 'weekly' },

  // Neighborhood Target Pages (Item 10)
  { url: '/stomatologie-dristor', priority: '0.9', changefreq: 'weekly' },
  { url: '/stomatologie-baba-novac', priority: '0.9', changefreq: 'weekly' },
  { url: '/stomatologie-prelungirea-ghencea', priority: '0.9', changefreq: 'weekly' },

  // Individual Treatment Pages (Item 1)
  { url: '/implant-dentar-bucuresti', priority: '0.9', changefreq: 'weekly' },
  { url: '/aparat-dentar-dristor', priority: '0.9', changefreq: 'weekly' },
  { url: '/albire-dentara-laser', priority: '0.9', changefreq: 'weekly' },
  { url: '/protetica-zirconiu', priority: '0.9', changefreq: 'weekly' },

  // Emergency & CAS Hub Pages (Item 12 & 14)
  { url: '/urgente-dentare-bucuresti', priority: '0.9', changefreq: 'weekly' },
  { url: '/decontat-cas', priority: '0.8', changefreq: 'weekly' },

  // Legal
  { url: '/gdpr', priority: '0.3', changefreq: 'yearly' },
  { url: '/confidentialitate', priority: '0.3', changefreq: 'yearly' },
  { url: '/termeni', priority: '0.3', changefreq: 'yearly' }
];

// 2. Read articles directly from articles.js
try {
  const articlesFile = fs.readFileSync(path.resolve('./src/data/articles.js'), 'utf-8');
  const titleMatches = [...articlesFile.matchAll(/title:\s*'([^']+)'/g)];
  titleMatches.forEach((match) => {
    const title = match[1];
    const slug = slugify(title);
    routes.push({
      url: `/articole/${slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    });
  });
} catch (e) {
  console.warn('Could not read articles for sitemap:', e.message);
}

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
