/**
 * Metadata for Admin-managed public-site text fields.
 *
 * Values live exclusively in the backend site_texts table and are returned by the
 * public bootstrap. This registry contains labels and rendering hints only.
 */

export const SITE_TEXT_GROUPS = [
  {
    "page": "Global",
    "items": [
      {
        "key": "footer.description",
        "label": "Footer — descriere clinică",
        "multiline": true
      }
    ]
  },
  {
    "page": "Acasă (/)",
    "items": [
      {
        "key": "home.hero.label",
        "label": "Hero — etichetă mică"
      },
      {
        "key": "home.hero.tagline",
        "label": "Hero — subtitlu",
        "multiline": true
      },
      {
        "key": "home.hero.callButton",
        "label": "Hero — buton telefon"
      },
      {
        "key": "home.hero.whatsappButton",
        "label": "Hero — buton WhatsApp"
      },
      {
        "key": "home.hero.contactButton",
        "label": "Hero — buton program/locație"
      },
      {
        "key": "home.trust.1.title",
        "label": "Hero statistică 1 — titlu"
      },
      {
        "key": "home.trust.1.text",
        "label": "Hero statistică 1 — text"
      },
      {
        "key": "home.trust.2.title",
        "label": "Hero statistică 2 — titlu"
      },
      {
        "key": "home.trust.2.text",
        "label": "Hero statistică 2 — text"
      },
      {
        "key": "home.trust.3.title",
        "label": "Hero statistică 3 — titlu"
      },
      {
        "key": "home.trust.3.text",
        "label": "Hero statistică 3 — text"
      },
      {
        "key": "home.contact.tag",
        "label": "Secțiune contact — etichetă"
      },
      {
        "key": "home.contact.title",
        "label": "Secțiune contact — titlu ({count} = nr. clinici)"
      },
      {
        "key": "home.services.tag",
        "label": "Secțiune servicii — etichetă"
      },
      {
        "key": "home.services.title",
        "label": "Secțiune servicii — titlu"
      },
      {
        "key": "home.services.lead",
        "label": "Secțiune servicii — descriere",
        "multiline": true
      },
      {
        "key": "home.services.cta",
        "label": "Secțiune servicii — buton"
      },
      {
        "key": "home.reviews.tag",
        "label": "Secțiune recenzii — etichetă"
      },
      {
        "key": "home.reviews.title",
        "label": "Secțiune recenzii — titlu"
      },
      {
        "key": "home.reviews.lead",
        "label": "Secțiune recenzii — descriere",
        "multiline": true
      },
      {
        "key": "home.reviews.cta",
        "label": "Secțiune recenzii — buton"
      },
      {
        "key": "home.gallery.tag",
        "label": "Secțiune clinică — etichetă"
      },
      {
        "key": "home.gallery.title",
        "label": "Secțiune clinică — titlu"
      },
      {
        "key": "home.gallery.lead",
        "label": "Secțiune clinică — descriere",
        "multiline": true
      },
      {
        "key": "home.team.tag",
        "label": "Secțiune echipă — etichetă"
      },
      {
        "key": "home.team.title",
        "label": "Secțiune echipă — titlu"
      },
      {
        "key": "home.team.lead",
        "label": "Secțiune echipă — descriere",
        "multiline": true
      },
      {
        "key": "home.tech.tag",
        "label": "Secțiune tehnologie — etichetă"
      },
      {
        "key": "home.tech.title",
        "label": "Secțiune tehnologie — titlu"
      },
      {
        "key": "home.tech.lead",
        "label": "Secțiune tehnologie — descriere",
        "multiline": true
      },
      {
        "key": "home.journey.tag",
        "label": "Secțiune traseu pacient — etichetă"
      },
      {
        "key": "home.journey.title",
        "label": "Secțiune traseu pacient — titlu"
      }
    ]
  },
  {
    "page": "Decontare CAS (/decontat-cas)",
    "items": [
      {
        "key": "cas.hero.tag",
        "label": "Hero — etichetă"
      },
      {
        "key": "cas.hero.title",
        "label": "Hero — titlu"
      },
      {
        "key": "cas.hero.subtitle",
        "label": "Hero — subtitlu",
        "multiline": true
      },
      {
        "key": "cas.ai.badge",
        "label": "Casetă rezumat — insignă"
      },
      {
        "key": "cas.ai.tag",
        "label": "Casetă rezumat — etichetă"
      },
      {
        "key": "cas.ai.text",
        "label": "Casetă rezumat — text",
        "multiline": true
      },
      {
        "key": "cas.stats.free.title",
        "label": "Statistică 1 — titlu"
      },
      {
        "key": "cas.stats.free.text",
        "label": "Statistică 1 — text"
      },
      {
        "key": "cas.stats.clinics.title",
        "label": "Statistică 2 — titlu ({count} = nr. clinici)"
      },
      {
        "key": "cas.stats.clinics.text",
        "label": "Statistică 2 — text ({names} = zonele clinicilor)"
      },
      {
        "key": "cas.stats.direct.title",
        "label": "Statistică 3 — titlu"
      },
      {
        "key": "cas.stats.direct.text",
        "label": "Statistică 3 — text"
      },
      {
        "key": "cas.children.title",
        "label": "Copii — titlu secțiune"
      },
      {
        "key": "cas.children.intro",
        "label": "Copii — introducere",
        "multiline": true
      },
      {
        "key": "cas.children.item1",
        "label": "Copii — beneficiu 1"
      },
      {
        "key": "cas.children.item2",
        "label": "Copii — beneficiu 2"
      },
      {
        "key": "cas.children.item3",
        "label": "Copii — beneficiu 3"
      },
      {
        "key": "cas.children.item4",
        "label": "Copii — beneficiu 4"
      },
      {
        "key": "cas.children.item5",
        "label": "Copii — beneficiu 5"
      },
      {
        "key": "cas.adults.title",
        "label": "Adulți — titlu secțiune"
      },
      {
        "key": "cas.adults.intro",
        "label": "Adulți — introducere",
        "multiline": true
      },
      {
        "key": "cas.adults.card1.title",
        "label": "Adulți card 1 — titlu"
      },
      {
        "key": "cas.adults.card1.text",
        "label": "Adulți card 1 — text",
        "multiline": true
      },
      {
        "key": "cas.adults.card2.title",
        "label": "Adulți card 2 — titlu"
      },
      {
        "key": "cas.adults.card2.text",
        "label": "Adulți card 2 — text",
        "multiline": true
      },
      {
        "key": "cas.adults.card3.title",
        "label": "Adulți card 3 — titlu"
      },
      {
        "key": "cas.adults.card3.text",
        "label": "Adulți card 3 — text",
        "multiline": true
      },
      {
        "key": "cas.steps.title",
        "label": "Pași — titlu secțiune"
      },
      {
        "key": "cas.docs.title",
        "label": "Acte — titlu secțiune"
      },
      {
        "key": "cas.docs.children.title",
        "label": "Acte copii — titlu"
      },
      {
        "key": "cas.docs.children.text",
        "label": "Acte copii — text",
        "multiline": true
      },
      {
        "key": "cas.docs.adults.title",
        "label": "Acte adulți — titlu"
      },
      {
        "key": "cas.docs.adults.text",
        "label": "Acte adulți — text",
        "multiline": true
      },
      {
        "key": "cas.note.label",
        "label": "Notă plafon — etichetă bold"
      },
      {
        "key": "cas.note.text",
        "label": "Notă plafon — text",
        "multiline": true
      },
      {
        "key": "cas.faq.title",
        "label": "FAQ — titlu secțiune"
      },
      {
        "key": "cas.sidebar.title",
        "label": "Card programare — titlu"
      },
      {
        "key": "cas.sidebar.text",
        "label": "Card programare — text",
        "multiline": true
      },
      {
        "key": "cas.sidebar.callButton",
        "label": "Card programare — buton telefon"
      },
      {
        "key": "cas.sidebar.whatsappButton",
        "label": "Card programare — buton WhatsApp"
      },
      {
        "key": "cas.sidebar.hours",
        "label": "Card programare — program"
      },
      {
        "key": "cas.sidebar.note",
        "label": "Card programare — notă verde"
      },
      {
        "key": "cas.banner.title",
        "label": "Banner final — titlu"
      },
      {
        "key": "cas.banner.text",
        "label": "Banner final — text ({count} = nr. clinici)",
        "multiline": true
      },
      {
        "key": "cas.banner.callButton",
        "label": "Banner final — buton telefon"
      },
      {
        "key": "cas.banner.whatsappButton",
        "label": "Banner final — buton WhatsApp"
      }
    ]
  },
  {
    "page": "Hero-uri pagini secundare",
    "items": [
      {
        "key": "tratamente.hero.tag",
        "label": "Tratamente — etichetă"
      },
      {
        "key": "tratamente.hero.title",
        "label": "Tratamente — titlu",
        "html": true
      },
      {
        "key": "tratamente.hero.subtitle",
        "label": "Tratamente — subtitlu",
        "multiline": true
      },
      {
        "key": "oferte.hero.tag",
        "label": "Oferte — etichetă"
      },
      {
        "key": "oferte.hero.title",
        "label": "Oferte — titlu",
        "html": true
      },
      {
        "key": "oferte.hero.subtitle",
        "label": "Oferte — subtitlu",
        "multiline": true
      },
      {
        "key": "noutati.hero.tag",
        "label": "Noutăți — etichetă"
      },
      {
        "key": "noutati.hero.title",
        "label": "Noutăți — titlu",
        "html": true
      },
      {
        "key": "noutati.hero.subtitle",
        "label": "Noutăți — subtitlu"
      },
      {
        "key": "articole.hero.tag",
        "label": "Articole — etichetă"
      },
      {
        "key": "articole.hero.title",
        "label": "Articole — titlu",
        "html": true
      },
      {
        "key": "articole.hero.subtitle",
        "label": "Articole — subtitlu"
      },
      {
        "key": "beforeafter.hero.tag",
        "label": "Before & After — etichetă"
      },
      {
        "key": "beforeafter.hero.title",
        "label": "Before & After — titlu",
        "html": true
      },
      {
        "key": "beforeafter.hero.subtitle",
        "label": "Before & After — subtitlu",
        "multiline": true
      },
      {
        "key": "recenzii.hero.tag",
        "label": "Recenzii — etichetă"
      },
      {
        "key": "recenzii.hero.title",
        "label": "Recenzii — titlu",
        "html": true
      },
      {
        "key": "recenzii.hero.subtitle",
        "label": "Recenzii — subtitlu",
        "multiline": true
      },
      {
        "key": "parteneri.hero.tag",
        "label": "Parteneri — etichetă"
      },
      {
        "key": "parteneri.hero.title",
        "label": "Parteneri — titlu",
        "html": true
      },
      {
        "key": "parteneri.hero.subtitle",
        "label": "Parteneri — subtitlu",
        "multiline": true
      },
      {
        "key": "ebook.hero.tag",
        "label": "E-bookuri — etichetă"
      },
      {
        "key": "ebook.hero.title",
        "label": "E-bookuri — titlu",
        "html": true
      },
      {
        "key": "ebook.hero.subtitle",
        "label": "E-bookuri — subtitlu",
        "multiline": true
      },
      {
        "key": "urgente.hero.tag",
        "label": "Urgențe — etichetă"
      },
      {
        "key": "urgente.hero.title",
        "label": "Urgențe — titlu"
      },
      {
        "key": "urgente.hero.subtitle",
        "label": "Urgențe — subtitlu",
        "multiline": true
      }
    ]
  },
  {
    "page": "Conținut pagini secundare",
    "items": [
      { "key": "tratamente.cas.title", "label": "Tratamente — banner CAS, titlu" },
      { "key": "tratamente.cas.text", "label": "Tratamente — banner CAS, text", "multiline": true },
      { "key": "tratamente.payment.title", "label": "Tratamente — plată, titlu" },
      { "key": "tratamente.payment.text", "label": "Tratamente — plată, text", "multiline": true },
      { "key": "tratamente.cta.title", "label": "Tratamente — programare, titlu" },
      { "key": "oferte.cta.title", "label": "Oferte — contact, titlu" },
      { "key": "oferte.cta.subtitle", "label": "Oferte — contact, text", "multiline": true },
      { "key": "oferte.note", "label": "Oferte — notă finală", "multiline": true },
      { "key": "parteneri.contact.text", "label": "Parteneri — invitație" },
      { "key": "parteneri.contact.button", "label": "Parteneri — buton contact" },
      { "key": "beforeafter.case.fallback", "label": "Before & After — etichetă caz fără tratament" },
      { "key": "beforeafter.cta.title", "label": "Before & After — CTA, titlu" },
      { "key": "beforeafter.cta.subtitle", "label": "Before & After — CTA, text" },
      { "key": "recenzii.rating.label", "label": "Recenzii — etichetă rating" },
      { "key": "recenzii.googleButton", "label": "Recenzii — buton Google" },
      { "key": "recenzii.cta.title", "label": "Recenzii — CTA, titlu" },
      { "key": "recenzii.cta.subtitle", "label": "Recenzii — CTA, text" },
      { "key": "scor.result.recommendations", "label": "Scor igienă — titlu recomandări" },
      { "key": "scor.result.shareButton", "label": "Scor igienă — buton WhatsApp" },
      { "key": "urgente.callButton", "label": "Urgențe — buton telefon" },
      { "key": "urgente.whatsappButton", "label": "Urgențe — buton WhatsApp" },
      { "key": "recenzie.redirect.title", "label": "Redirecționare recenzie — titlu" },
      { "key": "recenzie.redirect.text", "label": "Redirecționare recenzie — text" },
      { "key": "recenzie.redirect.button", "label": "Redirecționare recenzie — buton" }
    ]
  },
  {
    "page": "Contact comun",
    "items": [
      { "key": "common.contact.title", "label": "Card contact — titlu implicit" },
      { "key": "common.contact.subtitle", "label": "Card contact — text implicit", "multiline": true },
      { "key": "common.contact.callButton", "label": "Card contact — buton telefon" },
      { "key": "common.contact.whatsappButton", "label": "Card contact — buton WhatsApp" }
    ]
  }
];
