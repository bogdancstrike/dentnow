/**
 * Page-local content retained only as a deterministic migration input.
 *
 * Task 13 exports this module into `backend/seeds/current-site.json`. Public pages
 * must consume the backend contracts; this file can be retired with the other legacy
 * data modules after Task 14's no-fallback parity gate passes.
 */

export const locationDetails = {
  dristor: {
    source_path: 'src/pages/LocationPage.jsx',
    subtitle: 'Clinică stomatologică în zona Dristor / Râmnicu Vâlcea (Sector 3)',
    seo: {
      title: 'Clinică Stomatologică Dristor — DentNow Râmnicu Vâlcea 29',
      description: 'DentNow Dristor — Cabinet stomatologic modern pe Str. Râmnicu Vâlcea nr. 29. Implanturi, aparate dentare, profilaxie și urgențe stomatologice în Sector 3.',
    },
    transit: [
      { mode: 'metrou', label: 'Metrou', detail: 'Stația Metrou Dristor 1 / Dristor 2 (5-7 minute de mers pe jos).' },
      { mode: 'transport_public', label: 'Autobuz / Tramvai', detail: 'Linia 330, 135, Tramvai 19, 23 (stația Râmnicu Sărat / Dristorului).' },
      { mode: 'parcare', label: 'Parcare', detail: 'Locuri de parcare disponibile pe Strada Râmnicu Vâlcea și în proximitate.' },
    ],
    faqs: [
      { question: 'Unde se află exact clinica DentNow Dristor?', answer: 'Clinica este situată pe Str. Râmnicu Vâlcea nr. 29, bloc 20D, la parter, ap. 1 (Interfon 01), în apropierea pieței Râmnicu Sărat și a metroului Dristor.' },
      { question: 'Cum pot face o programare la sediul Dristor?', answer: 'Puteți suna direct la 0720 509 802 sau ne puteți scrie pe WhatsApp pentru o programare rapidă în aceeași zi.' },
      { question: 'Ce tratamente sunt disponibile la sediul Dristor?', answer: 'Servicii complete: implantologie dentară, ortodonție, protetică zirconiu, igienizare GBT, albire laser și stomatologie pediatrică.' },
    ],
  },
  'baba-novac': {
    source_path: 'src/pages/LocationPage.jsx',
    subtitle: 'Clinică stomatologică în zona Baba Novac / Dristor (Sector 3)',
    seo: {
      title: 'Clinică Stomatologică Baba Novac — DentNow Dristorului 96',
      description: 'DentNow Baba Novac — Cabinet dentar pe Str. Dristorului 96, Sector 3. Servicii stomatologice complete, aparate dentare, implanturi și igienizare.',
    },
    transit: [
      { mode: 'metrou', label: 'Metrou', detail: 'Stația Metrou Dristor / Piața Muncii (8 minute de mers pe jos).' },
      { mode: 'transport_public', label: 'Autobuz / Troleibuz', detail: 'Liniile 70, 79, 311 (stația Baba Novac / Dristorului).' },
      { mode: 'parcare', label: 'Parcare', detail: 'Parcare rezidențială și stradală accesibilă pe Strada Dristorului.' },
    ],
    faqs: [
      { question: 'Unde se află sediul DentNow Baba Novac?', answer: 'Adresa exactă este Str. Dristorului nr. 96, bloc 12B, scara B, parter, ap. 47, la intersecția zonelor Baba Novac și Dristor.' },
      { question: 'Aveți servicii de ortodonție și implanturi la Baba Novac?', answer: 'Da, oferim consultații de specialitate, aparate dentare fixe sau transparente și implantologie cu echipamente moderne.' },
    ],
  },
  'prelungirea-ghencea': {
    source_path: 'src/pages/LocationPage.jsx',
    subtitle: 'Clinică stomatologică modernă în Prelungirea Ghencea (Sector 6)',
    seo: {
      title: 'Clinică Stomatologică Prelungirea Ghencea — DentNow Ghencea 91F',
      description: 'DentNow Prelungirea Ghencea 91F — Cabinet stomatologic în Sector 6. Implantologie, stomatologie copii, protetică și igienă dentară.',
    },
    transit: [
      { mode: 'autobuz', label: 'Autobuz', detail: 'Liniile 122, 222, 385, 422 (stația Valea Oltului / Prelungirea Ghencea).' },
      { mode: 'tramvai', label: 'Tramvai', detail: 'Linia 41 (Ghencea / Drumul Taberei).' },
      { mode: 'parcare', label: 'Parcare', detail: 'Spații de parcare ușor accesibile în zona ansamblului rezidențial Ghencea 91F.' },
    ],
    faqs: [
      { question: 'Care este numărul de telefon al clinicii din Prelungirea Ghencea?', answer: 'Ne puteți contacta direct la 0723 232 263 sau prin mesaj instant pe WhatsApp.' },
      { question: 'Clinica oferă servicii de urgență stomatologică?', answer: 'Da, asigurăm tratamente rapide pentru dureri dentare acute, abcese și traume în limita programului de lucru.' },
    ],
  },
};

export const treatmentDetails = {
  '/implant-dentar-bucuresti': {
    source_path: 'src/pages/TreatmentDetail.jsx',
    slug: 'implant-dentar-bucuresti',
    category_id: 'implanturi',
    seo: {
      title: 'Implant Dentar București — Preț 1.490 lei | DentNow Dristor & Ghencea',
      description: 'Implant dentar Bredent și titan certificat CE în București. Preț promoțional 1.490 lei, rate fără dobândă și intervenție ghidată digital 3D.',
    },
    hero: {
      tag: 'Implantologie Dentară',
      title: 'Implant Dentar în București — Soluția Definitivă pentru Dinți Lipsă',
      subtitle: 'Redobândește un zâmbet estetic, fix și funcțional cu un plan explicat înaintea intervenției.',
    },
    overview: 'Implantul dentar reprezintă o rădăcină artificială din titan sau zirconiu, inserată în osul maxilar pentru a înlocui un dinte lipsă. La DentNow, procedura este planificată digital 3D pentru stabilitate și protejarea țesuturilor sănătoase.',
    benefits: [
      'Nu necesită șlefuirea dinților vecini sănătoși',
      'Ajută la prevenirea resorbției osului maxilar',
      'Oferă funcționalitate apropiată de cea a unui dinte natural',
      'Plan și deviz explicate înaintea tratamentului',
    ],
    detail_markdown: `## Ce este un implant dentar și când este recomandat?

Implantul dentar este o soluție modernă pentru înlocuirea unuia sau mai multor dinți lipsă. Spre deosebire de punțile dentare tradiționale, implantul nu necesită șlefuirea dinților adiacenți.

### Avantajele implanturilor dentare la DentNow

- **Diagnosticare 3D CBCT:** planificare chirurgicală digitală cu precizie.
- **Controlul durerii:** anestezie locală și protocoale minim invazive.
- **Materiale certificate CE:** implanturi din titan biocompatibil.

### Etapele inserării implantului dentar

1. Consultație și tomografie 3D.
2. Inserarea chirurgicală.
3. Perioada de osteointegrare.
4. Montarea coroanei definitive.`,
    faqs: [
      { question: 'Cât costă un implant dentar la DentNow?', answer: 'Prețul promoțional afișat pentru implant este de 1.490 lei, redus de la 2.500 lei. Costul final se confirmă după consultație și investigații.' },
      { question: 'Procedura de inserare a implantului este dureroasă?', answer: 'Tratamentul se efectuează sub anestezie locală. Disconfortul de după intervenție diferă de la pacient la pacient și este discutat cu medicul.' },
      { question: 'Cât durează osteointegrarea implantului?', answer: 'Perioada obișnuită de osteointegrare este de câteva luni și depinde de os, poziție și situația clinică individuală.' },
    ],
  },
  '/aparat-dentar-dristor': {
    source_path: 'src/pages/TreatmentDetail.jsx',
    slug: 'aparat-dentar-dristor',
    category_id: 'ortodontie',
    seo: {
      title: 'Aparat Dentar Dristor & Ghencea — Ortodonție București | DentNow',
      description: 'Aparate dentare metalice, din safir și gutiere transparente în București. Opțiunea potrivită se stabilește după consultația ortodontică.',
    },
    hero: {
      tag: 'Ortodonție',
      title: 'Aparat Dentar Fix & Alignere Transparente în București',
      subtitle: 'Corectarea mușcăturii și alinierea dinților printr-un plan ortodontic individual.',
    },
    overview: 'Tratamentul ortodontic aliniază dinții și corectează ocluzia prin forțe controlate. DentNow oferă opțiuni de la aparate metalice clasice la aparate din safir și alignere transparente.',
    benefits: [
      'Plan individual pentru copii și adulți',
      'Opțiuni metalice, din safir și alignere transparente',
      'Poate îmbunătăți masticația și igienizarea',
      'Monitorizare periodică pe durata tratamentului',
    ],
    detail_markdown: `## Tipuri de aparate dentare disponibile

Alegerea aparatului depinde de complexitatea cazului, obiectivele medicale, preferințele estetice și buget.

### Aparat dentar metalic fix

O opțiune rezistentă și eficientă inclusiv pentru cazuri ortodontice complexe.

### Aparat dentar din safir

Brackeții transparenți sunt discreți și potriviți pacienților care doresc o variantă fixă mai puțin vizibilă.

### Alignere transparente

Gutiere detașabile planificate etapizat, recomandate numai după evaluarea indicației clinice.`,
    faqs: [
      { question: 'Cât timp trebuie purtat aparatul dentar?', answer: 'Durata depinde de poziția dinților și obiectivele tratamentului; medicul oferă o estimare după investigații și consultație.' },
      { question: 'Aparatul dentar provoacă durere?', answer: 'După montare sau activare poate exista sensibilitate temporară la mestecare, care de regulă scade progresiv.' },
    ],
  },
  '/albire-dentara-laser': {
    source_path: 'src/pages/TreatmentDetail.jsx',
    slug: 'albire-dentara-laser',
    category_id: 'albire',
    seo: {
      title: 'Albire Dentară Profesională București — BlancOne | DentNow',
      description: 'Albire dentară profesională BlancOne în cabinet la DentNow. Indicația și rezultatul realist se stabilesc după evaluarea smalțului și gingiilor.',
    },
    hero: {
      tag: 'Estetică Dentară',
      title: 'Albire Dentară Profesională în Cabinet',
      subtitle: 'Protocol BlancOne realizat după evaluarea sănătății dentare și gingivale.',
    },
    overview: 'Albirea profesională folosește agenți controlați pentru reducerea pigmentărilor dentare. Procedura se efectuează în cabinet după evaluarea contraindicațiilor și protejarea gingiilor.',
    benefits: [
      'Procedură realizată sub supraveghere medicală',
      'Protejarea țesuturilor gingivale',
      'Așteptări explicate înaintea procedurii',
      'Recomandări clare pentru menținerea rezultatului',
    ],
    detail_markdown: `## De ce albire profesională în cabinet?

Spre deosebire de produsele utilizate fără supraveghere, albirea în cabinet permite evaluarea smalțului, izolarea gingiilor și alegerea unui protocol potrivit.

### Tehnologia BlancOne

Protocolul folosește un gel profesional activat în cabinet. Rezultatul diferă în funcție de nuanța inițială, restaurările existente și obiceiurile pacientului.`,
    faqs: [
      { question: 'Cât durează efectul albirii dentare?', answer: 'Durata rezultatului variază în funcție de igiena orală și consumul de cafea, ceai, vin roșu sau tutun.' },
      { question: 'Albirea dentară afectează smalțul?', answer: 'Indicația și protocolul sunt stabilite de medic pentru a proteja smalțul și gingiile; procedura nu este recomandată automat tuturor pacienților.' },
    ],
  },
  '/protetica-zirconiu': {
    source_path: 'src/pages/TreatmentDetail.jsx',
    slug: 'protetica-zirconiu',
    category_id: 'proteze',
    seo: {
      title: 'Coroane Dentare Zirconiu & EMAX București | DentNow',
      description: 'Coroane dentare din zirconiu și ceramică EMAX la DentNow. Materialul și soluția protetică se aleg după evaluarea funcțională și estetică.',
    },
    hero: {
      tag: 'Protetică Dentară',
      title: 'Coroane & Fațete Dentare din Zirconiu și Ceramică EMAX',
      subtitle: 'Restaurări protetice planificate pentru funcție, integrare gingivală și aspect natural.',
    },
    overview: 'Coroanele din zirconiu sunt realizate digital dintr-un material rezistent și biocompatibil. Alegerea dintre zirconiu, ceramică EMAX sau altă soluție se face în funcție de poziția dintelui și situația clinică.',
    benefits: [
      'Materiale biocompatibile și fără suport metalic',
      'Rezistență adaptată zonei tratate',
      'Planificare și adaptare digitală',
      'Nuanță aleasă pentru integrarea cu dinții vecini',
    ],
    detail_markdown: `## De ce este folosit zirconiul în protetica modernă?

Zirconiul permite realizarea unor restaurări fără suport metalic, cu rezistență bună și integrare estetică. Planul protetic urmărește sănătatea gingiei, ocluzia și adaptarea restaurării la dinții vecini.`,
    faqs: [
      { question: 'Cât durează realizarea unei coroane din zirconiu?', answer: 'Durata depinde de pregătirea dintelui, etapele de laborator și eventualele tratamente necesare înaintea restaurării definitive.' },
    ],
  },
};

export const pageContent = {
  '/': {
    source_path: 'src/pages/Home.jsx',
    seo: {
      title: 'DentNow - Clinica stomatologică în București',
      description: 'DentNow oferă consultații, urgențe, implanturi, igienizare GBT, albire, ortodonție și tratamente pentru copii în București.',
    },
    sections: [
      { block_type: 'home_hero', payload: { label: 'Clinică stomatologică · București', title: 'DentNow', tagline: 'Tratament explicat clar, deviz înainte de intervenție și programări rapide pentru urgențe.', media: '/assets/dentnow/treatment-room.svg' } },
      { block_type: 'home_contact_intro', payload: { eyebrow: 'Contact, locații și program', title_template: 'Cele {clinic_count} clinici DentNow din București.' } },
      { block_type: 'home_services_intro', payload: { eyebrow: 'Servicii DentNow', title: 'Tratamente uzuale, explicate pe înțelesul pacientului.', lead: 'Am păstrat informațiile care ajută pacientul să decidă: serviciu, preț de pornire și pas următor.' } },
      { block_type: 'home_reviews_intro', payload: { eyebrow: 'Recenzii pacienți', title: 'Experiențe recente și verificabile.', lead: 'Recenziile afișate trebuie să păstreze sursa și data verificării.' } },
    ],
  },
  '/decontat-cas': {
    source_path: 'src/pages/DecontatCas.jsx',
    seo: {
      title: 'Tratamente Dentare Decontate CAS & Stomatologie Copii Gratuit | DentNow',
      description: 'Servicii stomatologice pentru copii și tratamente eligibile pentru decontare CAS la clinicile DentNow din București.',
    },
    sections: [
      { block_type: 'page_hero', payload: { tag: 'SERVICII DECONTATE CAS & GRATUITĂȚI PEDIATRIE', title: 'Tratamente Dentare Decontate prin CAS & Stomatologie Gratuită pentru Copii', subtitle: 'DentNow este în contract cu Casa de Asigurări de Sănătate, în limita serviciilor și plafoanelor aplicabile.' } },
      { block_type: 'cas_overview', payload: { label: 'Decontare CAS DentNow', tag: 'Ghid Asigurați CAS', text: 'Persoanele asigurate și copiii cu vârsta de până la 18 ani pot beneficia de servicii stomatologice decontate integral sau parțial, în condițiile și limita plafonului CAS disponibil.' } },
      { block_type: 'cas_stats', payload: { items: [{ value: '0–18 ani', label: 'Servicii eligibile pentru copii' }, { value: '3 clinici', label: 'Dristor · Baba Novac · Prelungirea Ghencea' }, { value: 'Fără dosar', label: 'Decontarea este gestionată de clinică' }] } },
      { block_type: 'cas_children', payload: { title: 'Stomatologie pentru copii (0–18 ani)', intro: 'Prin contractul CAS, copiii pot primi servicii eligibile fără cost pentru părinți, în limita plafonului disponibil.', items: ['Consultație de specialitate', 'Obturații pentru dinți temporari și definitivi', 'Sigilări pentru prevenirea cariilor', 'Extracții ale dinților temporari', 'Servicii preventive eligibile'] } },
      { block_type: 'cas_adults', payload: { title: 'Tratamente decontate pentru adulți asigurați', intro: 'Pachetul de bază poate acoperi consultații, tratamentul cariilor și extracții, integral sau parțial, conform regulilor CAS.', items: [{ title: 'Consultație & Diagnostic', text: 'Evaluare și plan de tratament în limita serviciilor eligibile.' }, { title: 'Obturații', text: 'Tratamentul cariilor în limita plafonului lunar.' }, { title: 'Extracții Dentare', text: 'Servicii decontate parțial sau integral, după caz.' }] } },
      { block_type: 'cas_documents', payload: { title: 'Acte necesare pentru programarea CAS', items: [{ title: 'Pentru copii', text: 'Certificat de naștere sau carte de identitate și actul de identitate al părintelui.' }, { title: 'Pentru adulți asigurați', text: 'Carte de identitate și dovada calității de asigurat.' }] } },
      { block_type: 'cas_notice', payload: { title: 'Bine de știut', text: 'Plafonul lunar decontat este limitat per clinică. Disponibilitatea se confirmă înaintea programării.' } },
      { block_type: 'cas_cta', payload: { title: 'Programează un consult decontat CAS', text: 'Verificăm plafonul disponibil și îți confirmăm clinica și intervalul de programare.' } },
    ],
  },
  '/urgente-dentare-bucuresti': {
    source_path: 'src/pages/UrgenteDentare.jsx',
    seo: {
      title: 'Urgențe Dentare București — Programări Rapide | DentNow',
      description: 'Pentru durere acută, abces sau traumă dentară, contactează clinicile DentNow din București pentru evaluarea disponibilității.',
    },
    sections: [
      { block_type: 'page_hero', payload: { tag: 'ASISTENȚĂ DENTARĂ RAPIDĂ', title: 'Urgențe Dentare în București — Scapă de Durere', subtitle: 'Echipa DentNow preia cu prioritate, în limita programului, dureri acute, abcese, traume și fracturi dentare.' } },
      { block_type: 'emergency_overview', payload: { label: 'Protocol Urgențe Dentare', tag: 'Ghid Medical Rapid', text: 'O urgență dentară necesită evaluare rapidă pentru controlul durerii, tratamentul infecției sau protejarea unui dinte traumatizat.' } },
      { block_type: 'emergency_triage', payload: { title: 'Ce reprezintă o urgență dentară și ce trebuie să faci', items: [{ title: 'Durere acută de măsea', text: 'Solicită evaluare. Nu aplica aspirină sau alte substanțe direct pe gingie.' }, { title: 'Abces dentar și umflătură', text: 'Aplică o compresă rece la exterior și contactează imediat clinica.' }, { title: 'Dinte avulsionat', text: 'Ține dintele de coroană, păstrează-l în lapte sau ser fiziologic și vino urgent la medic.' }, { title: 'Coroană sau proteză fracturată', text: 'Păstrează piesa, evită masticația în zonă și solicită o programare.' }] } },
      { block_type: 'emergency_hours', payload: { title: 'Program de preluare urgențe', text: 'Luni – Vineri: 09:00 – 19:00 · Sâmbătă: 09:00 – 15:00' } },
    ],
  },
};

export const footerContent = {
  source_path: 'src/components/layout/Footer.jsx',
  description: 'Clinică stomatologică în București, cu tratamente explicate clar, deviz înainte de intervenție și acces rapid la echipa fiecărei locații.',
};
