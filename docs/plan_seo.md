# DentNow — Comprehensive SEO Optimization & Fast Google Indexing Plan

> **Objective:** Maximize organic search visibility, achieve instant Google indexing (24-72 hours), and dominate local search rankings in Bucharest for high-intent keywords (e.g., *"clinică stomatologică Dristor"*, *"implant dentar București"*, *"dentist Prelungirea Ghencea"*, *"aparat dentar Baba Novac"*).

---

## 📊 Overview & Current SEO Audit

| Metric / Aspect | Current Status | SEO Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| **Rendering Strategy** | React SPA (Client-Side Rendered via Vite) | Medium | Implement static pre-rendering or SSR generation so Googlebot receives raw HTML with full content. |
| **Robots.txt** | Missing | High (Critical) | Create `public/robots.txt` linking to sitemap. |
| **XML Sitemap** | Missing | High (Critical) | Generate `public/sitemap.xml` with all main pages, location pages, and articles. |
| **Structured Data (Schema.org)** | Basic `Dentist` JSON-LD in `Seo.jsx` | Medium | Expand with `LocalBusiness`, `GeoCoordinates`, `MedicalProcedure`, `FAQPage`, and `BreadcrumbList`. |
| **Location Pages** | Unified in Config/Footer | High | Create dedicated local landing pages (`/locatii/dristor`, `/locatii/baba-novac`, `/locatii/prelungirea-ghencea`). |
| **Favicon & PWA Icons** | Fully Implemented (SVG, ICO, PNGs) | Optimized | Complete. |
| **Favicon & Manifest Meta** | Linked in `index.html` | Optimized | Complete. |

---

## 🚀 Priority Action Matrix

```
       HIGH IMPACT
          ▲
          │   [P0.1] Robots.txt & Sitemap       [P1.1] Enhanced Schema.org
          │   [P0.3] Prerendering / Static HTML [P2.1] Location Landing Pages
          │   [P0.4] Search Console & GBP       [P3.1] Keyword Pillar Pages
          │
          │   [P1.2] Dynamic Meta Tuning        [P2.2] Local Directory Citations
          │   [P1.4] Canonical Enforcement      [P3.3] Image Alt & WebP Optimization
          └─────────────────────────────────────────────────────────────────►  COMPLEXITY / EFFORT
              LOW EFFORT                               HIGH EFFORT
```

---

## 🔴 Priority 0 (P0): Immediate Quick Wins for Fast Indexing (< 48 Hours)

These actions guarantee that Google crawlers find, index, and cache all pages within 24 to 72 hours.

### P0.1 Create `public/robots.txt`
* **File to create:** `public/robots.txt`
* **Action:** Direct Googlebot, Bingbot, and mobile crawlers to all key pages while referencing `sitemap.xml`.
* **Content:**
  ```txt
  User-agent: *
  Allow: /

  Sitemap: https://www.dentnow.ro/sitemap.xml
  ```

---

### P0.2 Generate `public/sitemap.xml`
* **File to create:** `public/sitemap.xml` (or build-time sitemap generator script `scripts/generate-sitemap.mjs`)
* **Action:** Map all routes with `lastmod`, `changefreq`, and relative `priority`.
* **Target URLs to include:**
  - `https://www.dentnow.ro/` (Priority 1.0, daily)
  - `https://www.dentnow.ro/tratamente` (Priority 0.9, weekly)
  - `https://www.dentnow.ro/oferte` (Priority 0.8, weekly)
  - `https://www.dentnow.ro/recenzii` (Priority 0.7, weekly)
  - `https://www.dentnow.ro/before-after` (Priority 0.7, monthly)
  - `https://www.dentnow.ro/scor-igiena` (Priority 0.7, monthly)
  - `https://www.dentnow.ro/articole` (Priority 0.8, weekly)
  - All blog posts (`/articole/albire-dentara-ghid`, `/articole/implant-dentar-vs-punte`, etc.)
  - Dedicated location pages (`/locatii/dristor`, `/locatii/baba-novac`, `/locatii/prelungirea-ghencea`)

---

### P0.3 Enable Static HTML Pre-rendering for Vite (Client-Side SPA Optimization)
* **Problem:** Because React renders client-side, search engines may experience indexing delays or missed content snippets.
* **Solution:** Integrate pre-rendering during `npm run build` using `vite-plugin-prerender` or an SSR HTML generator script (`scripts/prerender.mjs`).
* **Expected Result:** Googlebot receives pre-rendered pure HTML files for `/`, `/tratamente`, `/oferte`, etc., allowing instant indexing and instant text parsing.

---

### P0.4 Google Search Console (GSC) & Google Business Profile (GBP) Submission
1. **Google Search Console Setup:**
   - Verify ownership via DNS TXT record or HTML tag.
   - Immediately submit `https://www.dentnow.ro/sitemap.xml`.
   - Use the **URL Inspection Tool** to request indexing for the homepage and main service pages.
2. **Google Business Profile (GBP) Linkage:**
   - Ensure the 3 official GBP listings point directly to the site/location URLs:
     - **DentNow Dristor** ➔ `https://www.dentnow.ro/locatii/dristor`
     - **DentNow Baba Novac** ➔ `https://www.dentnow.ro/locatii/baba-novac`
     - **DentNow Prelungirea Ghencea** ➔ `https://www.dentnow.ro/locatii/prelungirea-ghencea`
   - Matching Name, Address, Phone (NAP) across GBP and website Schema.

---

## 🟡 Priority 1 (P1): Technical & On-Page SEO

### P1.1 Enhanced Rich Snippets & Structured Data (`Schema.org`)
* **File to modify:** `src/components/seo/Seo.jsx`
* **Schema Implementations:**

1. **`Dentist` / `LocalBusiness` Multi-Location Schema:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Dentist",
     "name": "DentNow Dristor",
     "image": "https://www.dentnow.ro/assets/dentnow/clinic-exterior.svg",
     "telePhone": "+40720509802",
     "priceRange": "$$",
     "address": {
       "@type": "PostalAddress",
       "streetAddress": "Str. Râmnicu Vâlcea nr. 29, Bl. 20D, parter, ap. 1",
       "addressLocality": "București",
       "postalCode": "031806",
       "addressCountry": "RO"
     },
     "geo": {
       "@type": "GeoCoordinates",
       "latitude": 44.4136318,
       "longitude": 26.1408659
     },
     "openingHoursSpecification": [
       {
         "@type": "OpeningHoursSpecification",
         "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
         "opens": "09:00",
         "closes": "19:00"
       },
       {
         "@type": "OpeningHoursSpecification",
         "dayOfWeek": "Saturday",
         "opens": "09:00",
         "closes": "15:00"
       }
     ]
   }
   ```

2. **`MedicalProcedure` & `Service` Schema:**
   - Applied on treatment sections (`Implantologie`, `Ortodonție`, `Estetică Dentară`).
   - Enables Google to understand medical services and pricing.

3. **`FAQPage` Schema:**
   - Converts accordion FAQs into interactive Google search snippets directly in search results.

4. **`BreadcrumbList` Schema:**
   - Renders clear navigation trails in Google SERP results (e.g. `dentnow.ro › Tratamente › Implant Dentar`).

---

### P1.2 Title Tag & Meta Description Optimization Matrix

| Page Route | Optimized Title Tag (Target < 60 chars) | Optimized Meta Description (Target 150-160 chars) |
| :--- | :--- | :--- |
| `/` | `Clinică Stomatologică București \| DentNow Dristor & Ghencea` | `DentNow — Clinică stomatologică modernă în București (Dristor, Baba Novac, Prelungirea Ghencea). Implanturi, aparate dentare, albire & urgențe. Programări rapide!` |
| `/tratamente` | `Prețuri & Tratamente Stomatologice București \| DentNow` | `Descoperă tratamentele stomatologice DentNow: implantologie, ortodonție, protetică, profilaxie și estetică dentară. Prețuri transparente & rate.` |
| `/oferte` | `Oferte & Promoții Stomatologice București \| DentNow` | `Pachete promoționale și oferte speciale la tratamente dentare în București. Detartraj, albire laser și consultații gratuite la DentNow.` |
| `/articole` | `Ghid Stomatologic & Sfaturi Îngrijire Dentară \| DentNow Blog` | `Articole și sfaturi utile scrise de medici stomatologi: îngrijire dentară, implanturi, aparate dentare invizibile și igienă orala.` |
| `/scor-igiena` | `Calculator Scor Igienă Dentară Gratuit \| DentNow` | `Evaluează-ți sănătatea și igiena dentară în doar 2 minute cu calculatorul interactiv DentNow. Primești recomandări personalizate de la specialiști.` |

---

### P1.3 Canonical Tag Enforcement & URL Normalization
* Ensure `Seo.jsx` generates consistent canonical URLs:
  - HTTPS prefix: `https://www.dentnow.ro`
  - Remove redundant query parameters (e.g. `?utm_source=...` cleaned in canonicals).
  - Strip trailing slashes consistently.

---

## 🟢 Priority 2 (P2): Local SEO & Multi-Location Strategy

Since DentNow operates 3 distinct physical clinics in Bucharest, local SEO provides the highest conversion rate.

### P2.1 Dedicated Location Landing Pages
Create 3 dedicated SEO pages with unique localized content:
1. `/locatii/dristor` — Target keywords: *"stomatologie Dristor"*, *"dentist Ramnicu Valcea"*, *"cabinet dentar Sector 3"*.
2. `/locatii/baba-novac` — Target keywords: *"dentist Baba Novac"*, *"stomatologie Dristor 96"*, *"implant dentar Dristor"*.
3. `/locatii/prelungirea-ghencea` — Target keywords: *"stomatologie Prelungirea Ghencea"*, *"dentist Ghencea Sector 6"*, *"urgenta stomatologica Ghencea"*.

**Page Structure for Each Location Landing Page:**
- Localized H1 Header (e.g. `Clinica Stomatologică DentNow Dristor`)
- Interactive Google Maps Embed with exact pin
- Local NAP & Direct Call Button
- Transport & Access instructions (Metro, Bus lines, Parking)
- Dedicated patient reviews for that specific branch
- Branch-specific JSON-LD `Dentist` Schema

---

### P2.2 Local Directory Citations & Backlink Foundation
Register the exact NAP info across key Romanian business indexes:
- Pagini Aurii (`paginiaurii.ro`)
- Cylex România (`cylex.ro`)
- ListaFirme (`listafirme.ro`)
- Stomatologie.ro
- Ghidul Primăriilor
- Waze & Apple Maps location registration

---

## 🔵 Priority 3 (P3): Content SEO & Keyword Cluster Expansion

### P3.1 Keyword Cluster Target Map

```
                          ┌──────────────────────────┐
                          │     DentNow Homepage     │
                          └────────────┬─────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Implantologie  │         │    Ortodonție    │         │ Estetică Dentară │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ - Implant Bredent│         │ - Aparat Metalic │         │ - Albire Laser   │
│ - Fast & Fixed   │         │ - Aparat Safir   │         │ - Fațete EMAX    │
│ - Sinus Lift     │         │ - Gutiere Align  │         │ - Estetică Roz   │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

### P3.2 Blog Content Strategy (High Intent Topics)
Publish 2-4 authoritative articles per month:
1. *"Cât Costă un Implant Dentar în București în 2026? Ghid Complet de Prețuri"*
2. *"Aparat Dentar Vizibil vs. Invisilign/Alignere: Ce Să Elegi?"*
3. *"Durerea de Dinți Noaptea: Ce Să Faci Până Ajungi la Stomatolog"*
4. *"Detartraj cu Ultrasunete și AirFlow: De Ce Este Esențial la 6 Luni"*

---

## ⚡ Technical Performance & Core Web Vitals (Google Speed Factors)

Google uses **Core Web Vitals** as a direct ranking factor.

| Metric | Target | Current Status | Optimization Strategy |
| :--- | :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | `< 1.8s` | Fast | Preload hero SVG/images & critical Google Fonts in `index.html`. |
| **FID / INP (Input Delay)** | `< 100ms` | Optimal | Code-split heavy components; non-blocking analytics scripts. |
| **CLS (Cumulative Layout Shift)** | `< 0.05` | Optimal | Specify explicit `width` and `height` attributes on all images/SVGs. |

---

## 🛠️ Implementation Checklist & Timeline

```
Week 1 (Immediate)     ████████████████  P0 Tasks (Robots, Sitemap, GSC Indexing, Prerender)
Week 2                 ████████████      P1 Tasks (Enhanced Schema, Meta Tags, Canonicals)
Week 3                 ██████████        P2 Tasks (Location Landing Pages, GBP Sync)
Week 4+                ████████████████  P3 Tasks (Content Clusters & Citation Linkbuilding)
```

| Task ID | Action Description | Target File(s) | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P0.1** | Create `robots.txt` file | `public/robots.txt` | **P0** | ⏳ Pending |
| **P0.2** | Build dynamic `sitemap.xml` script & file | `public/sitemap.xml`, `scripts/` | **P0** | ⏳ Pending |
| **P0.3** | Implement prerendering/static export for Vite | `vite.config.js` / scripts | **P0** | ⏳ Pending |
| **P0.4** | Submit sitemap to Google Search Console | GSC Dashboard | **P0** | ⏳ Manual Step |
| **P1.1** | Add LocalBusiness, FAQ, and Procedure Schemas | `src/components/seo/Seo.jsx` | **P1** | ⏳ Pending |
| **P1.2** | Audit and optimize title tags & meta descriptions | `src/pages/*`, `src/data/*` | **P1** | ⏳ Pending |
| **P2.1** | Build location pages (`/locatii/dristor`, etc.) | `src/pages/locations/*` | **P2** | ⏳ Pending |
| **P2.2** | Sync Google Business Profiles with location URLs | GBP Accounts | **P2** | ⏳ Manual Step |
| **P3.1** | Add keyword-optimized medical content & FAQs | `src/data/content.js` | **P3** | ⏳ Pending |
