# DentNow Presentation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current DentNow React SPA into a professional, trustworthy, mobile-friendly presentation and lead-generation website for a dental clinic in Bucuresti.

**Architecture:** Keep the current Vite + React + React Router structure, but split credibility content, conversion flows, SEO metadata, and reusable presentation sections into focused modules. Replace placeholder visuals and simulated forms with real clinic assets and honest lead-capture behavior.

**Tech Stack:** React 18, React Router 6, Vite 6, custom CSS, optional lead endpoint configured through Vite environment variables.

---

## Audit Baseline

- Production build passes: `npm run build` generated `dist/index.html`, one CSS bundle, and one JS bundle.
- Lint is currently broken: `npm run lint` fails with `sh: 1: eslint: not found` because `package.json:10` defines `eslint src/`, but `package.json:17-20` does not install ESLint.
- Chrome headless rendered the homepage, treatments page, and quiz route at desktop and mobile sizes. The local image viewer was unavailable because the filesystem sandbox failed, so final visual QA still needs a human browser pass.
- Current date for stale-content review: 2026-07-04. News, legal dates, and promotions dated 2024 need content owner review before launch.
- Dark-mode source inspection found a concrete contrast bug: `src/styles/main.css:35` changes `--black` to a light text color, but button styles such as `.btn-dark`, `.cta-phone-big`, `.nav-cta-mobile`, and `.qc-next` keep white text on `var(--black)`.

## Priority Findings

1. **Credibility risk: "real" proof is not real proof yet.** `src/pages/BeforeAfter.jsx:12-18` says cases are real, but `src/data/content.js:142-149` renders emoji before/after placeholders. This should not ship as clinical proof.
2. **Lead capture is simulated.** Ebook forms in `src/pages/Ebook.jsx:13-35` always show success after timers and do not send data anywhere.
3. **Content is stale or unverifiable.** News dates in `src/pages/Noutati.jsx:18` and `src/data/content.js:163-167` are from 2024; review/rating claims in `src/pages/Recenzii.jsx:15-17` need to match a live source or verified export.
4. **Offer and consultation messaging conflicts.** The homepage says the initial consultation is free at `src/pages/Home.jsx:144`, while `src/data/content.js:50` lists `Consultatie primara` at `150 lei`.
5. **SEO is too thin for a clinic site.** `index.html:6-7` has one static title and description for every route, with no route metadata, LocalBusiness/Dentist schema, sitemap, or Open Graph image.
6. **The site looks more like a concept than a clinic.** Core pages rely on emoji and gradients for services, articles, partners, ebooks, news, and before/after proof. A dental clinic site needs real clinic photos, doctor profiles, equipment proof, consented case images, and practical patient details.
7. **Mobile navigation and conversion need tightening.** Desktop navigation is crowded (`src/data/navigation.js:1-10`), mobile navigation uses emoji labels (`src/data/navigation.js:12-23`), and the fixed FAB can overlap content on small screens (`src/components/layout/FloatingButtons.css:1-17`).
8. **Accessibility gaps exist in navigation, modals, toasts, and motion.** The hamburger has no `aria-expanded` (`src/components/layout/Navbar.jsx:49`), article and ebook modals do not trap focus (`src/pages/Articole.jsx:29-40`, `src/pages/Ebook.jsx:66-80`), toast output is not announced (`src/hooks/useToast.jsx:17-21`), and scroll animation has no reduced-motion fallback (`src/styles/main.css:249-263`).
9. **Dark mode has button contrast regressions.** `.btn-dark` uses `background: var(--black)` and `color: #fff` (`src/styles/main.css:183-185`), but in dark mode `--black` becomes `#f0f0f5` (`src/styles/main.css:35`), causing white-on-light buttons. The same pattern appears in `src/pages/Home.css:31`, `src/components/layout/Navbar.css:70-73`, and `src/pages/ScorIgiena.css:72-80`.

## File Ownership Map

- Modify `src/data/content.js`: service copy, offers, trust stats, before/after data, ebooks, news, quiz recommendations, schedule.
- Modify `src/data/navigation.js`: desktop grouping, mobile labels, resource/clinic grouping.
- Modify `src/config.js`: add booking URL, lead endpoint, analytics IDs, verified review URL, and content-review date fields.
- Modify `src/pages/Home.jsx` and `src/pages/Home.css`: professional hero, appointment panel, trust proof, real media, mobile spacing.
- Modify `src/pages/Tratamente.jsx` and `src/pages/Tratamente.css`: clearer pricing, service details, sticky appointment CTA, mobile table behavior.
- Modify `src/pages/Oferte.jsx`, `src/pages/BeforeAfter.jsx`, `src/pages/Recenzii.jsx`, `src/pages/Noutati.jsx`, `src/pages/Ebook.jsx`, `src/pages/Articole.jsx`: content honesty, lead behavior, SEO, accessibility.
- Modify `src/components/layout/Navbar.jsx`, `src/components/layout/Navbar.css`, `src/components/layout/FloatingButtons.jsx`, `src/components/layout/FloatingButtons.css`, `src/components/layout/Footer.jsx`: navigation IA, CTA consistency, mobile safety.
- Modify `src/styles/main.css` and theme-sensitive page CSS files: dark-mode tokens, button variants, focus states, and contrast-safe component surfaces.
- Create `src/components/sections/AppointmentPanel.jsx`: reusable appointment form/card.
- Create `src/components/sections/ProofGallery.jsx`: reusable clinic/team/equipment/case gallery.
- Create `src/components/seo/Seo.jsx`: route metadata and JSON-LD injection.
- Create `src/lib/leadCapture.js`: one lead-submission path for appointment, ebook, quiz, and offer leads.
- Create `src/data/clinicProof.js`: doctors, certifications, equipment, CAS details, financing, gallery assets.
- Create `src/pages/NotFound.jsx`: proper 404 route instead of silently rendering Home for every unknown path.
- Add real assets under `public/assets/clinic/`, `public/assets/team/`, `public/assets/cases/`, `public/assets/partners/`, and `public/assets/seo/`.
- Modify `package.json`: repair lint script and add tooling scripts.

---

## Task 1: Fix Launch-Blocking Credibility And Content Bugs

**Files:**
- Modify: `src/data/content.js`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/BeforeAfter.jsx`
- Modify: `src/pages/Recenzii.jsx`
- Modify: `src/pages/Noutati.jsx`
- Modify: `src/pages/Ebook.jsx`
- Modify: `src/pages/GDPR.jsx`
- Modify: `src/pages/Confidentialitate.jsx`
- Modify: `src/pages/Termeni.jsx`
- Modify: `src/pages/LegalContent.jsx`

- [ ] Replace the before/after headline `Cazuri Reale DentNow` with `Exemple de tratamente DentNow` until consented patient photos are available.
- [ ] Remove emoji before/after placeholders from public-facing proof. If real case photos are unavailable, hide `/before-after` from desktop/mobile/footer navigation and keep the route unlinked.
- [ ] Reconcile the consultation conflict. Choose one launch rule and apply it everywhere:
  - If consultation is paid: change `src/pages/Home.jsx:144` and `src/pages/BeforeAfter.jsx:28` to avoid "consultatia initiala este gratuita".
  - If consultation is free: change `src/data/content.js:50` to `Consultatie primara`, `0 lei`, and add a clear eligibility note.
- [ ] Replace `200+ recenzii verificate Google` in `src/pages/Recenzii.jsx:17` with a verified count from the live Google profile or a phrasing that does not claim a count.
- [ ] Update or remove all 2024 news items in `src/pages/Noutati.jsx:18` and `src/data/content.js:163-167`. For launch, show only items that are current as of 2026-07-04 or rename the page to `Arhiva`.
- [ ] Stop fake ebook success states. Until `src/lib/leadCapture.js` exists, change ebook submit behavior to open WhatsApp or mail client with a prefilled request instead of saying the ebook was sent.
- [ ] Replace duplicated generic legal content. `GDPR`, `Confidentialitate`, and `Termeni` should have distinct content and include the clinic operator identity, data controller contact, medical-data basis, cookie policy, appointment data retention, and ANSPDCP complaint link.

**Verification:**
- Run `npm run build`.
- Review `/`, `/before-after`, `/recenzii`, `/noutati`, `/ebook`, `/gdpr`, `/confidentialitate`, and `/termeni` manually at `390px`, `768px`, and desktop widths.

## Task 2: Add Real Clinical Visual Proof

**Files:**
- Create: `src/data/clinicProof.js`
- Create: `src/components/sections/ProofGallery.jsx`
- Add assets: `public/assets/clinic/`, `public/assets/team/`, `public/assets/cases/`, `public/assets/partners/`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/BeforeAfter.jsx`
- Modify: `src/pages/Parteneri.jsx`
- Modify: `src/pages/Articole.jsx`
- Modify: `src/pages/Ebook.jsx`
- Modify: `src/data/content.js`

- [ ] Add clinic-owned images: exterior entrance, reception, cabinet, sterilization area, EMS/GBT equipment, microscope, radiology, and at least one doctor/team portrait.
- [ ] Add consented case images only if the clinic has signed patient consent for web publication. Store pairs under `public/assets/cases/<case-slug>-before.webp` and `public/assets/cases/<case-slug>-after.webp`.
- [ ] Replace partner emoji with official or text-only partner marks. Do not use brand logos unless the clinic has permission.
- [ ] Replace article and ebook emoji thumbnails with either real photos, professionally designed covers, or clean text covers with no emoji.
- [ ] Add alt text for every image in `clinicProof.js`, written for patients, not developers.

**Acceptance Criteria:**
- Homepage first viewport shows DentNow as a real clinic, not only a text brand.
- Before/after page either shows consented real cases or is not linked from navigation.
- No public-facing proof card relies on emoji as the main visual.

## Task 3: Redesign The Homepage For Professional First Impression

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Home.css`
- Modify: `src/data/content.js`
- Create: `src/components/sections/AppointmentPanel.jsx`
- Create: `src/components/sections/TrustStrip.jsx`

- [ ] Replace the current map-heavy hero (`src/pages/Home.jsx:25-40`) with a two-column desktop hero: left side value proposition and CTAs, right side real clinic/team image plus compact appointment panel.
- [ ] Keep the hero headline literal and trustworthy: `DentNow - Clinica stomatologica in Bucuresti`. Move long service lists into the supporting copy.
- [ ] Move Google Maps from the hero into the contact section only. Keep one iframe on the page and use a static location summary above it.
- [ ] Keep four high-value trust chips above the fold: Google rating, same-day emergency handling, CAS/card support, transparent prices.
- [ ] Replace repeated generic statements like "fara compromisuri" with concrete proof: equipment, doctors, sterilization, price transparency, child-friendly care.
- [ ] On mobile, show CTA order as: `Suna`, `WhatsApp`, `Programare`, then address/program. Avoid forcing the map into the first viewport.

**Verification:**
- At `390px` width, primary CTA must be visible without horizontal scroll.
- At `1440px` width, hero must show a real clinic/team visual and not look like a generic SaaS landing page.

## Task 4: Build One Honest Lead-Capture System

**Files:**
- Create: `src/lib/leadCapture.js`
- Create: `src/components/sections/AppointmentPanel.jsx`
- Modify: `src/config.js`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Oferte.jsx`
- Modify: `src/pages/Tratamente.jsx`
- Modify: `src/pages/Ebook.jsx`
- Modify: `src/pages/ScorIgiena.jsx`

- [ ] Add config fields:

```js
bookingUrl: import.meta.env.VITE_BOOKING_URL || '',
leadEndpoint: import.meta.env.VITE_LEAD_ENDPOINT || '',
```

- [ ] Implement `submitLead(payload)` in `src/lib/leadCapture.js`:
  - If `config.leadEndpoint` is set, `POST` JSON and return success only on a `2xx` response.
  - If no endpoint is set, return `{ fallback: 'whatsapp' }` with a prefilled WhatsApp message.
  - Never show "sent" unless the data was actually submitted.
- [ ] Appointment fields: name, phone, service, preferred day, message, GDPR consent checkbox.
- [ ] Ebook fields: name, email, selected ebook, GDPR consent checkbox.
- [ ] Quiz result CTA: send score to WhatsApp or endpoint with selected risk category.
- [ ] Offer CTA: preselect the offer/service in the appointment panel.

**Verification:**
- Test with no `VITE_LEAD_ENDPOINT`: every form opens WhatsApp with the submitted context.
- Test with a mock local endpoint returning `200`: success toast appears.
- Test with a mock endpoint returning `500`: error state appears and no fake success message is shown.

## Task 5: Repair Navigation And Mobile UX

**Files:**
- Modify: `src/data/navigation.js`
- Modify: `src/components/layout/Navbar.jsx`
- Modify: `src/components/layout/Navbar.css`
- Modify: `src/components/layout/FloatingButtons.jsx`
- Modify: `src/components/layout/FloatingButtons.css`
- Modify: `src/components/layout/Footer.jsx`

- [ ] Group desktop navigation into fewer top-level items:
  - `Tratamente`
  - `Oferte`
  - `Recenzii`
  - `Clinica` dropdown: Before/After, Parteneri, Contact
  - `Resurse` dropdown: Articole, Noutati, Scor Igiena, Ebook
- [ ] Remove emoji labels from mobile navigation and use plain text with optional SVG icons.
- [ ] Add `aria-expanded`, `aria-controls`, and `id` to the mobile menu.
- [ ] Add a backdrop and close on `Escape`.
- [ ] Collapse desktop nav earlier, around `1100px`, because the current link set is crowded at tablet widths.
- [ ] Replace the two floating circular buttons on mobile with a bottom action bar using safe-area padding:

```css
padding-bottom: calc(12px + env(safe-area-inset-bottom));
```

**Verification:**
- Keyboard users can open, navigate, and close the menu.
- No fixed CTA overlaps footer/legal links at `390px` width.

## Task 6: Improve Services, Pricing, And Offer Pages

**Files:**
- Modify: `src/data/content.js`
- Modify: `src/pages/Tratamente.jsx`
- Modify: `src/pages/Tratamente.css`
- Modify: `src/pages/Oferte.jsx`
- Modify: `src/pages/Oferte.css`
- Modify: `src/pages/Home.jsx`

- [ ] Expand each treatment with patient-focused details: what it solves, appointment duration, pain/anesthesia expectations, number of visits, starting price, and when the price is only estimated.
- [ ] Add FAQs below key treatment categories: implants, whitening, orthodontics, GBT hygiene, children, emergency dentistry.
- [ ] Keep price tables scannable on mobile. For rows with old prices, show both current and old prices on mobile rather than hiding the old price at `src/pages/Tratamente.css:20`.
- [ ] Remove excessive urgency language from offers unless each offer has a real end date.
- [ ] Add "last updated" text near prices and offers.
- [ ] Add a service-specific appointment CTA after each major treatment category.

**Verification:**
- Every service card links to an existing section id.
- Price and promo claims have a visible update date and no contradiction with other pages.

## Task 7: Add Trust Sections Patients Expect

**Files:**
- Create: `src/data/clinicProof.js`
- Create: `src/components/sections/DoctorTeam.jsx`
- Create: `src/components/sections/TechnologySection.jsx`
- Create: `src/components/sections/PatientJourney.jsx`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Parteneri.jsx`
- Modify: `src/components/layout/Footer.jsx`

- [ ] Add doctors/team section with name, role, areas of focus, photo, and licensing/credential summary.
- [ ] Add technology section: EMS Guided Biofilm Therapy, microscope Carl Zeiss, digital radiology/CBCT if actually available, sterilization workflow.
- [ ] Add patient journey: appointment, diagnosis, treatment plan, pricing/deviz, treatment, aftercare.
- [ ] Add CAS explanation: what is covered, who qualifies, what documents are needed, and what is not covered.
- [ ] Add payment/financing section only if the clinic has an active provider or clear in-house policy.

**Verification:**
- A first-time patient can answer: who treats me, where do I go, how much may it cost, how do I book, and what happens at the first visit.

## Task 8: Add Route-Level SEO And Local Clinic Schema

**Files:**
- Create: `src/components/seo/Seo.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Tratamente.jsx`
- Modify: `src/pages/Oferte.jsx`
- Modify: `src/pages/Articole.jsx`
- Modify: `src/pages/Recenzii.jsx`
- Modify: `src/pages/BeforeAfter.jsx`
- Modify: `src/pages/Noutati.jsx`
- Modify: `src/pages/ScorIgiena.jsx`
- Modify: `src/pages/Parteneri.jsx`
- Modify: `src/pages/Ebook.jsx`
- Modify: `index.html`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Add asset: `public/assets/seo/dentnow-og.webp`

- [ ] Add a reusable `Seo` component that sets title, description, canonical URL, Open Graph tags, and JSON-LD.
- [ ] Add `Dentist` or `MedicalBusiness` schema with name, address, phone, URL, opening hours, map URL, and sameAs social links.
- [ ] Add route-specific titles and descriptions for every public route.
- [ ] Convert articles from modal-only content (`src/pages/Articole.jsx:29-40`) into indexable routes such as `/articole/:slug`.
- [ ] Add sitemap entries for all public routes and article slugs.
- [ ] Add one Open Graph image that uses real clinic branding or photo.

**Verification:**
- Browser title changes per route.
- Page source or DOM contains one JSON-LD block per route.
- `robots.txt` references `sitemap.xml`.

## Task 9: Accessibility, Motion, And Interaction Hardening

**Files:**
- Modify: `src/components/layout/Navbar.jsx`
- Modify: `src/pages/Articole.jsx`
- Modify: `src/pages/Ebook.jsx`
- Modify: `src/hooks/useToast.jsx`
- Modify: `src/hooks/useDragScroll.js`
- Modify: `src/components/ui/Tooth3D.jsx`
- Modify: `src/styles/main.css`
- Modify relevant page CSS files.

- [ ] Add accessible dialog behavior for article and ebook modals: `role="dialog"`, `aria-modal="true"`, labelled heading, focus trap, `Escape` close, and return focus to trigger.
- [ ] Add `aria-live="polite"` and `role="status"` to the toast container.
- [ ] Convert drag scrolling to pointer events so mouse, touch, and pen input work consistently.
- [ ] Add visible horizontal-scroll controls or scroll snap for reviews.
- [ ] Add reduced-motion CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] Disable `Tooth3D` scroll transforms when reduced motion is enabled, or remove the component if it does not support the professional clinic direction.

**Verification:**
- Full keyboard pass on nav, article modal, ebook modal, quiz, and appointment form.
- Reduced-motion mode has no large scroll animations.

## Task 10: Fix Dark-Mode Contrast And Theme Tokens

**Files:**
- Modify: `src/styles/main.css`
- Modify: `src/pages/Home.css`
- Modify: `src/components/layout/Navbar.css`
- Modify: `src/pages/ScorIgiena.css`
- Modify: `src/pages/Oferte.css`
- Modify: `src/pages/Tratamente.css`
- Modify: `src/pages/Ebook.css`
- Modify: `src/pages/Articole.css`
- Modify: `src/pages/Noutati.css`
- Modify: `src/pages/Parteneri.css`
- Modify: `src/pages/BeforeAfter.css`
- Modify: all components using inline `color` or `background` values tied to light-mode assumptions.

- [ ] Split semantic colors from literal colors. Keep `--text-primary`, `--surface`, `--surface-raised`, `--button-primary-bg`, `--button-primary-text`, `--button-secondary-bg`, `--button-secondary-text`, `--border`, and `--muted-text` tokens.
- [ ] Fix `.btn-dark` so it does not use `var(--black)` as a background in dark mode. Use explicit semantic button tokens:

```css
:root,
[data-theme='light'] {
  --button-primary-bg: #1d1d1f;
  --button-primary-text: #ffffff;
}

[data-theme='dark'] {
  --button-primary-bg: #f5f5f7;
  --button-primary-text: #0a0a0a;
}

.btn-dark {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}
```

- [ ] Apply the same token fix to `.cta-phone-big` in `src/pages/Home.css:31`, `.nav-mobile .nav-cta-mobile` in `src/components/layout/Navbar.css:70-73`, `.qc-next` in `src/pages/ScorIgiena.css:72-80`, and all inline button styles using `btn-dark`.
- [ ] Audit icon colors inside buttons. Avoid hardcoding `color="#fff"` for icons inside buttons whose text color changes by theme; use `currentColor`.
- [ ] Add visible focus states for both light and dark mode:

```css
:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

- [ ] Check card/surface contrast in dark mode for offer cards, treatment tables, quiz cards, article cards, ebook cards, partner cards, modal boxes, and footer links.
- [ ] Check hover states in dark mode. `background: var(--black); color: #fff` hover styles can become unreadable after `--black` flips to light text.
- [ ] Add a small contrast QA table to `docs/qa_checklist.md` or the final QA section with these states: normal, hover, focus, disabled, selected, active nav, modal close, toast, CTA bar.

**Verification:**
- Toggle dark mode and manually inspect `/`, `/tratamente`, `/oferte`, `/articole`, `/recenzii`, `/scor-igiena`, `/ebook`, and legal pages at desktop and `390px` mobile width.
- Verify all primary buttons meet WCAG AA contrast in both themes.
- Verify icons inside buttons remain readable because they inherit `currentColor`.
- Run `npm run build` after token changes.

## Task 11: Repair Tooling And Add QA Checks

**Files:**
- Modify: `package.json`
- Create: `eslint.config.js`
- Create: `scripts/smoke-check.mjs`

- [ ] Install lint tooling:

```bash
npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y globals
```

- [ ] Replace the lint script with:

```json
"lint": "eslint \"src/**/*.{js,jsx}\""
```

- [ ] Add `eslint.config.js` covering React, hooks, JSX accessibility, and browser globals.
- [ ] Add a smoke script that builds the site, previews it locally, and checks key routes return HTML: `/`, `/tratamente`, `/oferte`, `/recenzii`, `/scor-igiena`, `/contact` if added.
- [ ] Add a visual QA checklist to this file or a separate `docs/qa_checklist.md`.

**Verification:**
- `npm run build` passes.
- `npm run lint` passes.
- Smoke script passes for all key routes.

---

## Recommended Implementation Order

1. Task 1 - fix misleading content and fake states before any visual polish.
2. Task 11 - repair lint/tooling so changes can be checked consistently.
3. Task 4 - add honest appointment and lead capture.
4. Task 3 - rebuild the homepage around real clinic proof and booking.
5. Task 5 - repair navigation and mobile CTA behavior.
6. Task 10 - fix dark-mode contrast and theme tokens before broad UI polish.
7. Task 2 and Task 7 - add real imagery, team, technology, and trust sections.
8. Task 6 - improve treatment and offer pages.
9. Task 8 and Task 9 - SEO, accessibility, motion, and interaction hardening.

## Final QA Checklist

- [ ] Desktop: 1440px homepage, treatments, offers, reviews, article detail, ebook modal, quiz result.
- [ ] Tablet: 768px homepage, nav, treatment table, offer grid.
- [ ] Mobile: 390px homepage, nav menu, CTA bar, treatment table, forms, modals, footer.
- [ ] Dark mode: every button, nav item, quiz option, modal action, footer link, and floating/bottom CTA remains readable in normal, hover, focus, disabled, selected, and active states.
- [ ] Keyboard-only: navigation, appointment form, modals, quiz, footer legal links.
- [ ] Content: all prices, offers, review counts, CAS claims, and legal text approved by the clinic.
- [ ] Performance: no duplicate maps above the fold; images served as optimized WebP/AVIF with dimensions.
- [ ] SEO: route titles/descriptions, sitemap, robots, canonical URLs, LocalBusiness/Dentist schema.
- [ ] Tooling: `npm run build` and `npm run lint` pass before deployment.
