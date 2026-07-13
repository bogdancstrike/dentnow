/**
 * Deterministically export the current frontend-owned content into a canonical seed
 * fixture consumed by the backend (backend/seeds/current-site.json), plus a manifest
 * of referenced assets (current-assets.json) with SHA-256 checksums. Assets are copied
 * into backend/seeds/assets/ so the backend image never needs a frontend build context.
 *
 * It imports the real data modules (no JSX regex scraping). config.js uses
 * `import.meta.env`, so it is bundled through esbuild with those values defined from
 * content-source.env — a controlled build-time environment.
 */
import { build } from 'esbuild';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FE = path.resolve(HERE, '..');
const SEEDS = path.resolve(FE, '..', 'backend', 'seeds');
const ASSETS_OUT = path.join(SEEDS, 'assets');
const SITE_FIXTURE = path.join(SEEDS, 'current-site.json');

fs.mkdirSync(ASSETS_OUT, { recursive: true });

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function clinicSlug(name) {
  return name
    .replace(/^DentNow\s+/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadConfig() {
  const env = parseEnv(path.join(FE, 'content-source.env'));
  const result = await build({
    entryPoints: [path.join(FE, 'src', 'config.js')],
    bundle: true,
    format: 'esm',
    write: false,
    define: { 'import.meta.env': JSON.stringify(env) },
  });
  const code = result.outputFiles[0].text;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  return mod.default;
}

const content = await import(path.join(FE, 'src', 'data', 'content.js'));
const navigation = await import(path.join(FE, 'src', 'data', 'navigation.js'));
const clinicProof = await import(path.join(FE, 'src', 'data', 'clinicProof.js'));
const casData = await import(path.join(FE, 'src', 'data', 'cas.js'));
const pageLocalData = await import(path.join(FE, 'src', 'data', 'pageContent.js'));
const config = await loadConfig();
if (!fs.existsSync(SITE_FIXTURE)) {
  throw new Error('backend/seeds/current-site.json is required to preserve already-migrated backend content');
}
const migratedBackendContent = JSON.parse(fs.readFileSync(SITE_FIXTURE, 'utf8'));

// ── collect + copy referenced assets ────────────────────────────────────────
const assetRefs = new Set();
const publicAssets = path.join(FE, 'public');
function collectAssets(obj) {
  if (obj == null) return;
  if (typeof obj === 'string') {
    const m = obj.match(/\/assets\/dentnow\/[A-Za-z0-9._-]+/g);
    if (m) m.forEach((p) => assetRefs.add(p));
  } else if (Array.isArray(obj)) obj.forEach(collectAssets);
  else if (typeof obj === 'object') Object.values(obj).forEach(collectAssets);
}
[content, navigation, clinicProof, migratedBackendContent.articles, migratedBackendContent.reviews]
  .forEach((m) => collectAssets(m));
// Always include the packaged dentnow asset directory (og image, doctors, cases).
for (const f of fs.readdirSync(path.join(publicAssets, 'assets', 'dentnow'))) {
  assetRefs.add(`/assets/dentnow/${f}`);
}

const assetManifest = [];
for (const ref of [...assetRefs].sort()) {
  const src = path.join(publicAssets, ref);
  if (!fs.existsSync(src)) continue;
  const data = fs.readFileSync(src);
  const sha = crypto.createHash('sha256').update(data).digest('hex');
  const base = path.basename(ref);
  fs.writeFileSync(path.join(ASSETS_OUT, base), data);
  assetManifest.push({ path: base, source_ref: ref, bytes: data.length, sha256: sha });
}

// ── canonical site fixture ───────────────────────────────────────────────────
const site = {
  schema: 'dentnow-seed-v1',
  site: { name: 'DentNow', locale: 'ro-RO', timezone: 'Europe/Bucharest' },
  contact: {
    phone: config.phone, phoneDisplay: config.phoneDisplay, email: config.email,
    whatsappUrl: config.whatsappUrl, reviewsUrl: config.verifiedReviewsUrl,
  },
  phones: config.phones,
  social: config.social,
  address: config.address,
  maps: config.maps,
  clinics: config.locations.map((clinic) => {
    const slug = clinicSlug(clinic.name);
    return { ...clinic, slug, ...(pageLocalData.locationDetails[slug] || {}) };
  }),
  schedule: content.scheduleHours,
  services: content.services,
  quickServices: content.quickServices,
  offers: content.offers,
  treatmentCategories: content.treatmentCategories,
  partners: content.partners,
  beforeAfterCases: content.beforeAfterCases,
  ebooks: content.ebooks,
  newsItems: content.newsItems,
  quizQuestions: content.quizQuestions,
  articles: migratedBackendContent.articles,
  reviews: migratedBackendContent.reviews,
  doctors: clinicProof.doctors,
  technologies: clinicProof.technologies,
  gallery: clinicProof.clinicGallery,
  patientJourney: clinicProof.patientJourney,
  trustStats: content.trustStats,
  footer: pageLocalData.footerContent,
  treatmentDetails: pageLocalData.treatmentDetails,
  pageContent: pageLocalData.pageContent,
  navigation: {
    desktop: navigation.navLinks, mobile: navigation.mobileNavLinks,
    footerServices: navigation.footerServices, footerClinic: navigation.footerClinic,
  },
  cas: casData.casData,
  legal: migratedBackendContent.legal,
};

fs.writeFileSync(SITE_FIXTURE, JSON.stringify(site, null, 2) + '\n');
fs.writeFileSync(path.join(SEEDS, 'current-assets.json'), JSON.stringify({ assets: assetManifest }, null, 2) + '\n');

console.log(
  `exported current-site.json (clinics=${site.clinics.length} offers=${site.offers.length} ` +
    `categories=${site.treatmentCategories.length} articles=${site.articles.length} ` +
    `reviews=${site.reviews.length} quiz=${site.quizQuestions.length}) + ${assetManifest.length} assets`,
);
