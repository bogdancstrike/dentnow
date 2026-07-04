# DentNow — Clinică Stomatologică București

Website-ul clinic stomatologic DentNow, rescris în **React 18** cu **Vite**, structură modulară pe componente reutilizabile.

## Tehnologii

- **React 18** + **React Router v6** — SPA cu client-side routing
- **Vite** — build tool rapid (dev server + production build)
- **CSS Modules / CSS custom** — stiluri organizate per componentă
- **Docker + nginx** — containerizare production-ready cu multi-stage build

## Structura proiectului

```
dentnow-react/
├── public/                    # Static assets (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, FloatingButtons, Layout
│   │   └── ui/                # PageHero, ReviewCard, SharedSections
│   ├── data/                  # Date centralizate (articole, reviews, content, navigation)
│   ├── hooks/                 # Custom hooks (useReveal, useScrollProgress, useDragScroll, useToast)
│   ├── pages/                 # Pagini: Home, Tratamente, Oferte, Articole, Recenzii, etc.
│   ├── styles/                # CSS global (main.css)
│   ├── config.js              # Configurări centralizate din env vars
│   ├── App.jsx                # Router principal
│   └── main.jsx               # Entry point
├── .env                       # Environment variables (nu se comite .env.local)
├── .gitignore
├── .dockerignore
├── Dockerfile                 # Multi-stage: node build → nginx serve
├── nginx.conf                 # SPA routing + security headers + gzip
├── package.json
├── vite.config.js
└── README.md
```

## Instalare și pornire

### Cerințe

- **Node.js** >= 18
- **npm** >= 9

### Development

```bash
# 1. Clonează repo-ul
git clone <repo-url>
cd dentnow-react

# 2. Instalează dependențele
npm install

# 3. (Opțional) Creează .env.local cu valorile tale
cp .env .env.local

# 4. Pornește dev server
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm run preview   # preview local al build-ului
```

### Docker

```bash
# Build imagine
docker build -t dentnow-website .

# Run container
docker run -d -p 8080:80 --name dentnow dentnow-website
# → http://localhost:8080
```

## Variabile de mediu (.env)

Toate datele clinicii sunt externalizate în `.env` — zero hardcodări în cod:

| Variabilă | Descriere | Exemplu |
|-----------|-----------|---------|
| `VITE_PHONE` | Număr telefon format internațional | `+40720509802` |
| `VITE_PHONE_DISPLAY` | Număr telefon afișat | `0720 509 802` |
| `VITE_EMAIL` | Email clinică | `office@dentnow.ro` |
| `VITE_WHATSAPP_URL` | Link WhatsApp pre-completat | `https://wa.me/40720509802?text=...` |
| `VITE_ADDRESS_STREET` | Adresă scurtă | `Str. Râmnicu Vâlcea 29` |
| `VITE_ADDRESS_DETAIL` | Detalii adresă | `Parter, Ap. 01 · București` |
| `VITE_ADDRESS_FULL` | Adresă completă | `Strada Râmnicu Vâlcea nr. 29...` |
| `VITE_MAPS_EMBED_URL` | Google Maps embed iframe URL | `https://www.google.com/maps/embed?pb=...` |
| `VITE_MAPS_LINK` | Google Maps link direct | `https://maps.app.goo.gl/...` |
| `VITE_FACEBOOK_URL` | Pagina Facebook | `https://www.facebook.com/dentnow` |
| `VITE_INSTAGRAM_URL` | Pagina Instagram | `https://www.instagram.com/dentnow` |
| `VITE_WEBSITE_URL` | Website URL | `https://www.dentnow.ro` |
| `VITE_PORT` | Port dev server | `3000` |

## Arhitectură și bune practici

### Componente reutilizabile
- **`PageHero`** — header secțiune reutilizabil (light/dark), folosit pe toate paginile interioare
- **`ReviewCard`** — card recenzie Google, folosit pe Home și Recenzii
- **`DarkCTA`** — banner CTA dark, reutilizat pe multiple pagini
- **`LegalPage`** — wrapper pentru paginile legale (GDPR, Termeni, Confidențialitate)

### Custom Hooks
- **`useReveal`** / **`useRevealAll`** — IntersectionObserver pentru animații scroll-reveal
- **`useScrollProgress`** — progress bar în partea de sus a paginii
- **`useDragScroll`** — drag-to-scroll pe secțiunile cu scroll orizontal
- **`useToast`** — Context + provider pentru notificări toast globale

### Date centralizate
- Toate datele (articole, reviews, servicii, oferte, tratamente, quiz) sunt în `/src/data/`
- Configurația clinicii vine din `.env` prin `/src/config.js`
- Zero hardcodări de telefon, email, adrese în componente

### Routing
- React Router v6 cu `Layout` outlet pattern
- Scroll-to-top automat la navigare
- Suport pentru hash links (`/tratamente#implanturi`)

## Pagini

| Rută | Pagina | Descriere |
|------|--------|-----------|
| `/` | Home | Landing page complet |
| `/tratamente` | Tratamente & Tarife | Lista prețuri cu sticky jump nav |
| `/oferte` | Oferte Speciale | Cards cu oferte promoționale |
| `/articole` | Articole Utile | Grid articole + modal detaliu |
| `/recenzii` | Recenzii Pacienți | Rating hero + grid recenzii |
| `/before-after` | Before & After | Cazuri transformare vizuală |
| `/noutati` | Noutăți | News layout principal + sidebar |
| `/scor-igiena` | Scor Igienă Orală | Quiz interactiv 7 întrebări |
| `/parteneri` | Parteneri | Grid parteneri cu badge-uri |
| `/ebook` | E-Bookuri Gratuite | Download ebooks cu capture email |
| `/gdpr` | GDPR | Pagina legală |
| `/confidentialitate` | Confidențialitate | Pagina legală |
| `/termeni` | Termeni și Condiții | Pagina legală |

## Licență

© 2024 DentNow. Toate drepturile rezervate.
