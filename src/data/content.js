// ── Services shown on homepage ──
export const services = [
  { icon: '🦷', title: 'Implanturi Dentare', desc: 'Implanturi titan premium. Soluția permanentă pentru dinți lipsă. De la 1.490 lei — ofertă specială.', link: '/tratamente#implanturi' },
  { icon: '✨', title: 'Albire BlancOne Click', desc: 'Până la 8 nuanțe mai alb într-o oră. 390 lei față de 590 lei — promo activ.', link: '/tratamente#albire' },
  { icon: '🎯', title: 'Ortodonție', desc: 'Aparate metalice sau alignere transparente. Corectăm dinții discret și eficient.', link: '/tratamente#ortodontie' },
  { icon: '👑', title: 'Proteze & Coroane', desc: 'Coroane zirconiu, metalo-ceramice sau ceramice pure. Estetică și funcționalitate perfectă.', link: '/tratamente#proteze' },
  { icon: '🛡️', title: 'Obturații & Endodonție', desc: 'Obturații estetice compozite, tratamente de canal cu lupe sau microscop Carl Zeiss.', link: '/tratamente#obturatii' },
  { icon: '👶', title: 'Pedodonție', desc: 'Sigilări 130–170 lei, fluorurări 50 lei/arcadă. Experiențe pozitive la dentist pentru copii.', link: '/tratamente#pediatrie' },
];

// ── Quick services strip on homepage ──
export const quickServices = [
  { icon: '🦷', label: 'Implanturi', price: '1.490 lei', link: '/tratamente#implanturi' },
  { icon: '✨', label: 'Albire', price: '390 lei', link: '/tratamente#albire' },
  { icon: '🧹', label: 'Igienizare GBT', price: '320 lei', link: '/tratamente#igienizare' },
  { icon: '🛡️', label: 'Obturații', price: '290 lei', link: '/tratamente#obturatii' },
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
  { value: '4.8', accent: '★', label: 'Rating Google' },
  { value: '15', accent: '+', label: 'Ani experiență' },
  { value: '5k', accent: '+', label: 'Pacienți mulțumiți' },
  { value: '1.490 lei', accent: '', label: 'Implant — ofertă', smallFont: true },
];

// ── Offers ──
export const offers = [
  { icon: '🦷', name: 'Implant Dentar Complet', desc: 'Implant titan premium cu ghid chirurgical digital pentru precizie maximă și recuperare rapidă.', price: '1.490 lei', oldPrice: '2.500 lei', save: '1.010 lei', badge: '-40%', features: ['Implant titan de calitate premium', 'Ghid chirurgical digital inclus', 'Coroană provizorie inclusă', 'Garanție extinsă'] },
  { icon: '⭐', name: 'Pachet Complet — 3 în 1', desc: 'Consultație primară + igienizare GBT completă + radiografie panoramică.', price: '390 lei', oldPrice: '650 lei', save: '260 lei', badge: 'Cel mai ales', featured: true, features: ['Consultație primară completă', 'Igienizare GBT — protocolul EMS', 'Radiografie panoramică digitală', 'Plan de tratament personalizat'] },
  { icon: '🦷', name: 'Albire BlancOne Click', desc: 'Albire profesională în cabinet. Până la 8 nuanțe mai alb într-o singură ședință.', price: '390 lei', oldPrice: '590 lei', save: '200 lei', badge: '-34%', features: ['Sistem BlancOne Click profesional', 'Până la 8 nuanțe mai alb', 'Protecție gingivală inclusă', 'Rezultat imediat vizibil'] },
  { icon: '🦷', name: 'Igienizare GBT', desc: 'Guided Biofilm Therapy — protocolul elvețian EMS. Curățare completă, blândă și nedureroasă.', price: '320 lei', oldPrice: '400 lei', save: '80 lei', badge: '-20%', features: ['Elimină 100% biofilmul bacterian', 'Curățare subgingivală', 'Zero durere, zero disconfort', 'Rezultat imediat vizibil'] },
  { icon: '🦷', name: 'Pachet Consultație + Igienizare', desc: 'Consultație primară completă + igienizare GBT.', price: '350 lei', oldPrice: '550 lei', save: '200 lei', badge: '-36%', features: ['Consultație completă cu radiografii', 'Igienizare GBT profesională', 'Plan de tratament inclus', 'Recomandări personalizate'] },
  { icon: '🦷', name: 'Consultație + Radio Panoramică', desc: 'Consultație primară + radiografie panoramică digitală.', price: '190 lei', oldPrice: '250 lei', save: '60 lei', badge: '-24%', features: ['Consultație primară completă', 'Radiografie panoramică digitală', 'Evaluarea riscului de carii', 'Recomandări de tratament'] },
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
  { icon: '🇨🇭', name: 'EMS Switzerland', type: 'Guided Biofilm Therapy', badge: 'Partener Oficial' },
  { icon: '🦷', name: 'Straumann', type: 'Implanturi Dentare Premium', badge: 'Furnizor Certificat' },
  { icon: '💎', name: 'BlancOne', type: 'Albire Dentară Profesională', badge: 'Partener Activ' },
  { icon: '🔬', name: 'Carl Zeiss', type: 'Microscoape Chirurgicale', badge: 'Utilizator Certificat' },
  { icon: '📡', name: 'Planmeca', type: 'Radiologie Digitală 3D CBCT', badge: 'Echipament Propriu' },
  { icon: '🏥', name: 'CNAS / CAS', type: 'Cardul de Sănătate', badge: 'Acceptăm' },
  { icon: '💳', name: 'Asigurări Medicale', type: 'Diverse Asigurători Privați', badge: 'Acceptăm' },
  { icon: '🎓', name: 'UMF București', type: 'Colaborare Academică', badge: 'Partener Educațional' },
];

// ── Before & After ──
export const beforeAfterCases = [
  { beforeEmoji: '😬', afterEmoji: '😁', treatment: 'Implantologie', title: 'Implant + Coroană Zirconiu', desc: 'Dinte lipsă înlocuit cu implant titan și coroană zirconiu. Rezultat complet natural, permanent. 1.490 lei cu oferta actuală.' },
  { beforeEmoji: '🦷', afterEmoji: '✨', treatment: 'Estetică', title: 'Albire BlancOne Click', desc: 'Dinți cu pete de coloranți transformați în 60 minute. 7 nuanțe mai alb. 390 lei cu oferta actuală.' },
  { beforeEmoji: '😕', afterEmoji: '😊', treatment: 'Ortodonție', title: 'Alignere Transparente', desc: 'Dinți înghesuiți corectați cu gutiere transparente în 14 luni. De la 1.250 lei/arcadă.' },
  { beforeEmoji: '🤕', afterEmoji: '😄', treatment: 'Reabilitare Completă', title: 'Full Smile Makeover', desc: 'Implanturi multiple + coroane + albire. Transformare completă a zâmbetului în 6 luni.' },
  { beforeEmoji: '😬', afterEmoji: '🤩', treatment: 'Estetică', title: 'Fațete Ceramice', desc: 'Dinți cu formă neregulată transformați cu fațete ceramice ultra-subțiri. Zâmbet de vedetă.' },
  { beforeEmoji: '😐', afterEmoji: '😁', treatment: 'Igienizare + Albire', title: 'GBT + BlancOne', desc: 'Tartru subgingival eliminat complet cu GBT, urmat de albire BlancOne. Pachet de la 640 lei.' },
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
  { cat: 'Ofertă', title: 'Implant la 1.490 lei — promo extins până la finalul anului', date: 'Noiembrie 2024', link: '/oferte' },
  { cat: 'Tehnologie', title: 'Noul microscop Carl Zeiss — precizie maximă la tratamentele de canal', date: 'Octombrie 2024', link: '/tratamente#endodontie' },
  { cat: 'Program', title: 'DentNow deschide sâmbăta 09:00–15:00 pentru pacienții ocupați', date: 'Octombrie 2024', link: '/' },
  { cat: 'CAS', title: 'Copiii beneficiază de servicii gratuite — DentNow lucrează cu Cardul de Sănătate', date: 'Septembrie 2024', link: '/tratamente' },
  { cat: 'Resurse', title: '6 e-bookuri gratuite disponibile acum — descarcă ghidurile medicilor DentNow', date: 'Septembrie 2024', link: '/ebook' },
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
