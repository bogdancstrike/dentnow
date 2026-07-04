// ── Services shown on homepage ──
export const services = [
  { icon: '01', title: 'Implanturi Dentare', desc: 'Solutii pentru dinti lipsa, cu plan chirurgical si deviz explicat inainte de tratament.', link: '/tratamente#implanturi' },
  { icon: '02', title: 'Igienizare GBT', desc: 'Protocol modern pentru biofilm, tartru si preventie, cu accent pe confortul pacientului.', link: '/tratamente#igienizare' },
  { icon: '03', title: 'Albire BlancOne Click', desc: 'Albire profesionala in cabinet, cu indicatii clare si asteptari realiste.', link: '/tratamente#albire' },
  { icon: '04', title: 'Ortodontie', desc: 'Aparate metalice sau alignere transparente, alese dupa consult si diagnostic.', link: '/tratamente#ortodontie' },
  { icon: '05', title: 'Obturații & Endodonție', desc: 'Restaurari estetice si tratamente de canal cu lupa sau microscop, in functie de caz.', link: '/tratamente#obturatii' },
  { icon: '06', title: 'Pedodontie', desc: 'Tratament prietenos pentru copii, cu explicatii pentru parinti si suport CAS unde se aplica.', link: '/tratamente#pediatrie' },
];

// ── Quick services strip on homepage ──
export const quickServices = [
  { icon: 'Implant', label: 'Implanturi', price: '1.490 lei', link: '/tratamente#implanturi' },
  { icon: 'Albire', label: 'Albire', price: '390 lei', link: '/tratamente#albire' },
  { icon: 'GBT', label: 'Igienizare GBT', price: '320 lei', link: '/tratamente#igienizare' },
  { icon: 'Obt', label: 'Obturații', price: '290 lei', link: '/tratamente#obturatii' },
];

// ── Why DentNow ──
export const whyItems = [
  { num: '01', title: 'Guided Biofilm Therapy — protocolul elvețian EMS', text: 'Igienizare completă, blândă și fără durere. Elimină biofilmul bacterian și tartrul subgingival cu eficiență maximă.' },
  { num: '02', title: 'Ghid chirurgical digital pentru implanturi', text: 'Precizie chirurgicală maximă, recuperare mai rapidă, riscuri minime. Protocoale moderne la DentNow.' },
  { num: '03', title: 'Tratamente fără durere + microscop Carl Zeiss', text: 'Anestezie modernă și microscop de precizie pentru endodonție. Sedare conștientă disponibilă.' },
  { num: '04', title: 'Lucrăm cu CAS — acceptăm cardul de sănătate', text: 'Servicii dentare decontate prin asigurarea de sănătate. Copii gratuit. Prețuri transparente, fără costuri ascunse.' },
];

// ── Trust stats ──
export const trustStats = [
  { value: '4.8/5', accent: '', label: 'Rating Google - de verificat inainte de lansare' },
  { value: 'Urgente', accent: '', label: 'Preluare prioritara in functie de program' },
  { value: 'CAS', accent: '', label: 'Suport pentru servicii eligibile si copii' },
  { value: 'Deviz clar', accent: '', label: 'Costuri explicate inainte de tratament' },
];

// ── Offers ──
export const offers = [
  { icon: 'Implant', name: 'Implant Dentar', desc: 'Evaluare si plan pentru inlocuirea dintilor lipsa. Pretul final se confirma dupa consult.', price: '1.490 lei', oldPrice: '2.500 lei', save: '1.010 lei', badge: 'Promo verificata', features: ['Implant titan', 'Plan chirurgical explicat', 'Coroana provizorie unde se aplica', 'Deviz inainte de tratament'] },
  { icon: '3 in 1', name: 'Pachet Consultație + Igienizare + Radiografie', desc: 'Pachet pentru pacientii care vor diagnostic, igienizare si plan clar.', price: '390 lei', oldPrice: '650 lei', save: '260 lei', badge: 'Recomandat', featured: true, features: ['Consultatie primara', 'Igienizare GBT', 'Radiografie panoramica', 'Plan de tratament'] },
  { icon: 'Albire', name: 'Albire BlancOne Click', desc: 'Albire profesionala in cabinet, potrivita dupa evaluarea smaltului si gingiilor.', price: '390 lei', oldPrice: '590 lei', save: '200 lei', badge: 'Estetica', features: ['Sistem profesional', 'Protectie gingivala', 'Rezultat vizibil', 'Recomandari aftercare'] },
  { icon: 'GBT', name: 'Igienizare GBT', desc: 'Guided Biofilm Therapy pentru preventie si confort.', price: '320 lei', oldPrice: '400 lei', save: '80 lei', badge: 'Preventie', features: ['Biofilm evidentiat', 'Curatare blanda', 'Recomandari de rutina', 'Control periodic'] },
  { icon: 'Consult', name: 'Consultație + Igienizare', desc: 'Pentru pacienti noi sau control periodic cu deviz actualizat.', price: '350 lei', oldPrice: '550 lei', save: '200 lei', badge: 'Plan clar', features: ['Consultatie', 'Igienizare profesionala', 'Deviz estimativ', 'Recomandari personalizate'] },
  { icon: 'Radio', name: 'Consultație + Radio Panoramică', desc: 'Diagnostic initial cu imagine panoramica acolo unde este indicata.', price: '190 lei', oldPrice: '250 lei', save: '60 lei', badge: 'Diagnostic', features: ['Consultatie', 'Radiografie panoramica', 'Evaluare risc carii', 'Plan de pas urmator'] },
];

// ── Treatments / tarife ──
export const treatmentCategories = [
  {
    id: 'consultatie', title: 'Consultații & Diagnostic',
    rows: [
      { name: 'Consultație primară', price: '150 lei' },
      { name: 'Pachet Consultație primară + Igienizare completă', price: '350 lei', oldPrice: '550 lei', promo: true },
      { name: 'Pachet Consultație + Igienizare completă + Radiografie panoramică', price: '390 lei', oldPrice: '650 lei', promo: true },
      { name: 'Pachet Consultație primară + Radiografie panoramică', price: '190 lei', oldPrice: '250 lei', promo: true },
    ],
  },
  {
    id: 'igienizare', title: 'Igienizare Profesională',
    rows: [{ name: 'Igienizare Guided Biofilm Therapy (GBT) — protocolul elvețian EMS', price: '320 lei', oldPrice: '400 lei', promo: true }],
    note: '* GBT elimină biofilmul bacterian și tartrul subgingival cu eficiență maximă. Recomandat de 2 ori pe an.',
  },
  {
    id: 'implanturi', title: 'Implantologie',
    rows: [{ name: 'Implant dentar (titan premium + ghid chirurgical digital)', price: '1.490 lei', oldPrice: '2.500 lei', promo: true }],
    note: '* Prețul include implantul, operația și coroana provizorie. Garanție inclusă.',
  },
  {
    id: 'obturatii', title: 'Restaurări (Obturații)',
    rows: [
      { name: 'Obturație superficială compozit', price: '290 lei', oldPrice: '350 lei', promo: true },
      { name: 'Obturație profundă compozit', price: '350 lei', oldPrice: '440 lei', promo: true },
    ],
  },
  {
    id: 'ortodontie', title: 'Ortodonție',
    rows: [
      { name: 'Aparat dentar brakeți metalici / arcadă', price: '2.500 lei' },
      { name: 'Alignere / arcadă (gutiere transparente)', price: 'de la 1.250 lei' },
    ],
    note: '* Prețul pe arcadă. Consultație gratuită pentru evaluare.',
  },
  {
    id: 'chirurgie', title: 'Chirurgie Orală',
    rows: [{ name: 'Extracție dinte prezent pe arcadă', price: '180–250 lei' }],
  },
  {
    id: 'pediatrie', title: 'Pedodonție (Copii)',
    rows: [
      { name: 'Sigilare / dinte', price: '130–170 lei' },
      { name: 'Fluorurare / arcadă', price: '50 lei' },
    ],
    casNote: 'Copiii beneficiază de servicii GRATUITE prin CAS (Cardul de Sănătate).',
  },
  {
    id: 'albire', title: 'Estetică Dentară',
    rows: [{ name: 'Albire dentară BlancOne Click (în cabinet, 1 oră, până la 8 nuanțe)', price: '390 lei', oldPrice: '590 lei', promo: true }],
  },
  {
    id: 'proteze', title: 'Protetică & Coroane',
    rows: [
      { name: 'Coroană metalo-ceramică', price: 'la cerere' },
      { name: 'Coroană ceramică pură / zirconiu', price: 'la cerere' },
      { name: 'Proteză totală mobilizabilă', price: 'la cerere' },
    ],
    note: '* Prețurile se stabilesc după evaluare. Contactați-ne pentru deviz personalizat.',
  },
  {
    id: 'endodontie', title: 'Endodonție (Tratamente de Canal)',
    rows: [
      { name: 'Tratament endodontic cu lupe', price: '300–600 lei' },
      { name: 'Tratament endodontic la microscop Carl Zeiss', price: '500–800 lei' },
      { name: 'Retratament endodontic', price: '600–900 lei' },
    ],
  },
];

export const jumpNavItems = [
  { id: 'consultatie', label: 'Consultații' },
  { id: 'igienizare', label: 'Igienizare' },
  { id: 'implanturi', label: 'Implanturi' },
  { id: 'obturatii', label: 'Obturații' },
  { id: 'ortodontie', label: 'Ortodonție' },
  { id: 'chirurgie', label: 'Chirurgie' },
  { id: 'pediatrie', label: 'Copii' },
  { id: 'albire', label: 'Albire' },
  { id: 'proteze', label: 'Proteze' },
  { id: 'endodontie', label: 'Endodonție' },
];

// ── Partners ──
export const partners = [
  { icon: 'EMS', name: 'EMS Switzerland', type: 'Guided Biofilm Therapy', badge: 'Tehnologie' },
  { icon: 'STR', name: 'Straumann', type: 'Implanturi dentare premium', badge: 'Furnizor' },
  { icon: 'B1', name: 'BlancOne', type: 'Albire dentara profesionala', badge: 'Sistem' },
  { icon: 'ZEISS', name: 'Carl Zeiss', type: 'Microscopie dentara', badge: 'Echipament' },
  { icon: 'RAD', name: 'Radiologie digitala', type: 'Diagnostic imagistic', badge: 'Diagnostic' },
  { icon: 'CAS', name: 'CNAS / CAS', type: 'Cardul de sanatate', badge: 'Eligibil' },
];

// ── Before & After ──
export const beforeAfterCases = [
  { beforeImage: '/assets/dentnow/case-implant-before.svg', afterImage: '/assets/dentnow/case-implant-after.svg', treatment: 'Implantologie', title: 'Implant + Coroana', desc: 'Placeholder ilustrativ. Inlocuieste cu fotografii reale doar dupa acordul pacientului.' },
  { beforeImage: '/assets/dentnow/case-whitening-before.svg', afterImage: '/assets/dentnow/case-whitening-after.svg', treatment: 'Estetica', title: 'Albire BlancOne Click', desc: 'Exemplu vizual de structura pentru pagina, nu rezultat clinic real.' },
  { beforeImage: '/assets/dentnow/case-ortho-before.svg', afterImage: '/assets/dentnow/case-ortho-after.svg', treatment: 'Ortodontie', title: 'Corectie aliniere', desc: 'Card pregatit pentru caz real documentat si aprobat pentru publicare.' },
];

// ── Ebooks ──
export const ebooks = [
  { icon: '📖', bg: 'ec1', cat: 'Igienă Orală', title: 'Ghidul Complet al Igienei Orale — 30 pagini', desc: 'Periaj corect, ață dentară, produse recomandate și cum previi cariile.', label: 'Ghidul Igienei Orale' },
  { icon: '🦷', bg: 'ec2', cat: 'Implantologie', title: 'Totul despre Implanturi Dentare — Ghid pentru Pacienți', desc: 'Pregătirea, procedura pas cu pas, recuperarea și îngrijirea pe termen lung.', label: 'Tot despre Implanturi' },
  { icon: '😁', bg: 'ec3', cat: 'Estetică', title: 'Zâmbetul Tău Perfect — Albire, Fațete & Estetică Dentară', desc: 'Toate opțiunile de îmbunătățire a zâmbetului comparate și explicate.', label: 'Zâmbetul Tău Perfect' },
  { icon: '👶', bg: 'ec4', cat: 'Pediatrie', title: 'Ghidul Părinților pentru Sănătatea Dentară a Copilului', desc: 'Când apare primul dinte, când prima vizită, cum previi cariile.', label: 'Ghidul Părinților' },
  { icon: '🎯', bg: 'ec5', cat: 'Ortodonție', title: 'Aparat Dentar sau Alignere? Ghid Complet de Decizie', desc: 'Diferențele, avantajele și dezavantajele fiecărei opțiuni ortodontice.', label: 'Aparat sau Alignere?' },
  { icon: '🛡️', bg: 'ec6', cat: 'Prevenție', title: 'Prevenția în Stomatologie — Cum Eviți Tratamentele Costisitoare', desc: 'Rutine zilnice, alimente recomandate, vizite periodice.', label: 'Prevenție & Sănătate' },
];

// ── News ──
export const newsItems = [
  { cat: 'Actualizare', title: 'Pagina de noutati trebuie aprobata de clinica inainte de lansare', date: 'Iulie 2026', link: '/noutati' },
  { cat: 'Program', title: 'Program afisat: Luni-Vineri 09:00-19:00, Sambata 09:00-15:00', date: 'Iulie 2026', link: '/#contact' },
  { cat: 'Pacienti', title: 'Sectiunile de oferte si preturi includ data ultimei actualizari', date: 'Iulie 2026', link: '/tratamente' },
];

// ── Quiz questions ──
export const quizQuestions = [
  {q:'Cât de des te periezi pe dinți?',opts:[['De 3 ori pe zi sau mai mult',5,'😁'],['De 2 ori pe zi',4,'🙂'],['O dată pe zi',2,'😐'],['Mai rar de o dată pe zi',0,'😬']]},
  {q:'Cum te periezi pe dinți?',opts:[['Electric, cu mișcări circulare, 2-3 minute',5,'⚡'],['Manual, corect, 2 minute',4,'✅'],['Repede, cum apuc',2,'⚡'],['Nu prea știu cum se face corect',0,'🤔']]},
  {q:'Folosești ața dentară sau irigatorul oral?',opts:[['Zilnic',5,'✅'],['De câteva ori pe săptămână',3,'👍'],['Rar, ocazional',1,'😐'],['Niciodată',0,'❌']]},
  {q:'Când ai fost ultima oară la stomatolog?',opts:[['În ultimele 6 luni',5,'🏆'],['Acum 6-12 luni',3,'👍'],['Acum 1-2 ani',1,'⚠️'],['Mai mult de 2 ani sau nu știu',0,'🚨']]},
  {q:'Ai efectuat o igienizare profesională în ultimul an?',opts:[['Da, igienizare GBT sau detartraj complet',5,'✨'],['Da, dar detartraj simplu rapid',3,'👍'],['Nu, dar am de gând',1,'😐'],['Nu și nici nu plănuiesc',0,'❌']]},
  {q:'Gingiile îți sângerează când te periezi sau bei rece/cald?',opts:[['Nu, niciodată',5,'🎉'],['Rar (o dată pe lună)',3,'👍'],['Adesea (câteva ori pe săptămână)',1,'⚠️'],['De fiecare dată când mă periez',0,'🚨']]},
  {q:'Consumi frecvent zahăr, cafea/ceai, fumezi sau ai o dietă acidă?',opts:[['Rar sau niciunul din cele de sus',5,'🌱'],['Cafea sau ceai fără zahăr zilnic',3,'☕'],['Dulciuri și/sau cafea cu zahăr zilnic',1,'🍬'],['Fumez și/sau consum zahăr zilnic',0,'🚬']]},
];

// ── Schedule / program hours ──
export const scheduleHours = [
  { day: 'Luni – Vineri', hours: '09:00 – 19:00', open: true },
  { day: 'Sâmbătă', hours: '09:00 – 15:00', open: true },
  { day: 'Duminică', hours: '—', open: false },
];
