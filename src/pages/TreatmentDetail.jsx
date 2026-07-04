import { useParams, Link, Navigate } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { IconPhone, IconClock, IconAlert } from '../components/ui/Icons';
import './TreatmentDetail.css';

const treatmentData = {
  'implant-dentar-bucuresti': {
    slug: 'implant-dentar-bucuresti',
    title: 'Implant Dentar București — Preț 1.490 lei | DentNow Dristor & Ghencea',
    description: 'Implant dentar Bredent & Titan certificat CE în București. Preț promoțional 1.490 lei. Rate fără dobândă, intervenție 100% nedureroasă cu ghid digital 3D.',
    tag: 'Implantologie Dentară',
    heroTitle: 'Implant Dentar în București — Soluția Definitivă pentru Dinți Lipsă',
    heroSubtitle: 'Rată de succes 98.7%. Redobândește un zâmbet estetic, fix și funcțional în doar 30 de minute.',
    aiOverview: 'Implantul dentar reprezintă o rădăcină artificială din titan pur sau zirconiu, inserată osteointegrat în osul maxilar pentru a înlocui un dinte lipsă. La DentNow București, procedura este complet nedureroasă, ghidată 3D, oferind stabilitate maximă, prevenind resorbția osoasă și menținând estetica facială naturală.',
    price: '1.490 lei',
    oldPrice: '2.500 lei',
    benefits: [
      'Nu necesită șlefuirea dinților vecini sănătoși',
      'Previne atrofierea (resorbția) osului maxilar',
      'Senzatie și funcționalitate identică cu un dinte natural',
      'Garanție extinsă și achitare în rate fixe fără dobândă'
    ],
    detailsHtml: `
      <h2>Ce este un implant dentar și când este recomandat?</h2>
      <p>Implantul dentar este standardul de aur în stomatologia modernă pentru înlocuirea unuia sau mai multor dinți lipsă. Spre deosebire de punțile dentare tradiționale, implantul nu afectează dinții adiacenți.</p>

      <h3>Avantajele implanturilor dentare la Clinica DentNow:</h3>
      <ul>
        <li><strong>Diagnosticare 3D CBCT:</strong> Planificare chirurgicală digitală cu precizie milimetrică.</li>
        <li><strong>Fără durere:</strong> Anestezie locală computerizată și protocoale minim invazive.</li>
        <li><strong>Materiale certificate CE:</strong> Implanturi din titan biocompatibil de la producători de top (Bredent, Alpha Bio).</li>
      </ul>

      <h3>Etapele inserării implantului dentar:</h3>
      <ol>
        <li><strong>Consultație & Tomografie 3D:</strong> Evaluarea densității osoase și stabilirea planului de tratament.</li>
        <li><strong>Inserarea chirurgicală:</strong> Procedură rapidă (20-30 min/implant).</li>
        <li><strong>Osteointegrare:</strong> Perioadă de vindecare de 3-4 luni.</li>
        <li><strong>Coroana definitivă:</strong> Montarea coroanei din zirconiu sau ceramică EMAX.</li>
      </ol>
    `,
    faqs: [
      { q: 'Cât costă un implant dentar la DentNow?', a: 'Prețul promoțional pentru un implant dentar este de 1.490 lei (reducere de la 2.500 lei). Oferim posibilitatea de plată în rate fixe.' },
      { q: 'Procedura de inserare a implantului este dureroasă?', a: 'Nu. Tratamentul se efectuează sub anestezie locală profundă. După intervenție, disconfortul este minim și ușor gestionabil cu analgezice obișnuite.' },
      { q: 'Cât durează osteointegrarea implantului?', a: 'Perioada standard de osteointegrare este între 3 și 4 luni la mandibulă și 4-6 luni la maxilar.' }
    ]
  },
  'aparat-dentar-dristor': {
    slug: 'aparat-dentar-dristor',
    title: 'Aparat Dentar Dristor & Ghencea — Ortodonție București | DentNow',
    description: 'Aparate dentare metalice, din safir și gutiere transparente (alignere) în București. Prețuri de la 1.250 lei/arcadă. Consultație ortodontică de specialitate.',
    tag: 'Ortodonție',
    heroTitle: 'Aparat Dentar Fix & Alignere Transparente în București',
    heroSubtitle: 'Corectează mușcătura și obține un zâmbet aliniat perfect la orice vârstă.',
    aiOverview: 'Tratamentul ortodontic cu aparat dentar aliniează dinții malpoziționați și corectează ocluzia (mușcătura) prin aplicarea unei presiuni constante controlate. La DentNow Dristor & Ghencea oferim opțiuni moderne: de la brakeți metalici clasici la aparate discrete din safir și alignere transparente invizibile.',
    price: 'de la 1.250 lei',
    oldPrice: '2.000 lei',
    benefits: [
      'Tratament ortodontic personalizat pentru copii și adulți',
      'Opțiuni ultra-discrete: safir transparent și alignere detașabile',
      'Îmbunătățește masticația, vorbirea și igienizarea dentară',
      'Planificarea tratamentului cu amprentă digitală'
    ],
    detailsHtml: `
      <h2>Tipuri de aparate dentare disponibile la DentNow</h2>
      <p>Alegerea aparatului dentar depinde de complexitatea cazului, preferințele estetice și bugetul pacientului.</p>

      <h3>1. Aparat Dentar Metalic Fix</h3>
      <p>Cea mai accesibilă și eficientă opțiune pentru cazurile ortodontice complexe. Extrem de rezistent și rapid în obținerea rezultatelor.</p>

      <h3>2. Aparat Dentar Safir Transparent</h3>
      <p>Brakeții din cristal de safir sunt aproape invizibili pe dinți și nu își schimbă culoarea în timp. Ideal pentru adulți și adolescenți.</p>

      <h3>3. Alignere Transparente (Gutiere Orto)</h3>
      <p>Gutiere din polimer flexibil, 100% invizibile și detașabile în timpul meselor. Permite o igienizare impecabilă.</p>
    `,
    faqs: [
      { q: 'Cât timp trebuie să port aparatul dentar?', a: 'Durata medie a tratamentului ortodontic este între 12 și 24 de luni, în funcție de gradul de aliniere necesar.' },
      { q: 'Aparatul dentar provoacă durere?', a: 'În primele 3-5 zile după montare sau activare poate exista o ușoară sensibilitate la mestecare, care dispare rapid.' }
    ]
  },
  'albire-dentara-laser': {
    slug: 'albire-dentara-laser',
    title: 'Albire Dentară Laser București — BlancOne | DentNow',
    description: 'Albire dentară profesională BlancOne în cabinet la DentNow. Până la 8 nuanțe mai alb în doar 30 minute. Fără sensibilitate dentară, preț promo 390 lei.',
    tag: 'Estetică Dentară',
    heroTitle: 'Albire Dentară Profesională în Cabinet — Zâmbet Strălucitor',
    heroSubtitle: 'Tehnologie italiană BlancOne. Rezultate vizibile instant fără a afecta smalțul.',
    aiOverview: 'Albirea dentară profesională reprezintă o procedură de estetică orala prin care agenți fotoreactivi (peroxid de hidrogen/carbamidă) activați de lumină laser sau LED descompun pigmenții din smalț. Sistemul BlancOne utilizat la DentNow garantează albirea cu până la 8 nuanțe în 30 de minute fără sensibilitate.',
    price: '390 lei',
    oldPrice: '700 lei',
    benefits: [
      'Rezultate spectaculoase vizibile imediat după prima ședință',
      'Tratament nedureros care protejează smalțul și gingiile',
      'Până la 8 nuanțe mai alb în doar 30-45 de minute',
      'Protocol complet combinat cu igienizare AirFlow'
    ],
    detailsHtml: `
      <h2>De ce să alegi albirea dentară profesională la stomatolog?</h2>
      <p>Spre deosebire de pastele sau benzile comerciale care pot fi abrazive, albirea în cabinet se desfășoară sub supravegherea medicului stomatolog, protejând gingiile și smalțul dentar.</p>

      <h3>Tehnologia BlancOne Click & Touch</h3>
      <p>Tehnologia BlancOne folosește energii scăzute de peroxid activat foto-dinamic, eliminând complet senzația de durere sau sensibilitatea dentară post-tratament.</p>
    `,
    faqs: [
      { q: 'Cât durează efectul albirii dentare?', a: 'Efectul albirii durează între 1 și 2 ani, în funcție de igiena orală și consumul de cafea, ceai, vin roșu sau tutun.' },
      { q: 'Albirea dentară dăunează smalțului?', a: 'Nu. Tratamentul BlancOne folosit la DentNow respectă structura smalțului și nu provoacă demineralizare.' }
    ]
  },
  'protetica-zirconiu': {
    slug: 'protetica-zirconiu',
    title: 'Coroane Dentare Zirconiu & EMAX București | DentNow',
    description: 'Coroane dentare din zirconiu monolitic și ceramică press EMAX la DentNow. Biocompatibilitate 100%, rezistență extremă și aspect natural insesizabil.',
    tag: 'Protetică Dentară',
    heroTitle: 'Coroane & Fațete Dentare din Zirconiu și Ceramică EMAX',
    heroSubtitle: 'Restaurări dentare de o estetică impecabilă și o durabilitate de lungă durată.',
    aiOverview: 'Coroana dentară din zirconiu reprezintă o învelitoare protetică realizată prin frezare computerizată CAD/CAM din dioxid de zirconiu. Materialul oferă o rezistență mecanică ieșită din comun, biocompatibilitate totală cu gingia și o transluciditate similară dinților naturali.',
    price: 'de la 800 lei',
    oldPrice: '1.200 lei',
    benefits: [
      'Biocompatibilitate 100% (fără reacții alergice sau lizereu gri la gingie)',
      'Rezistență la presiuni masticatorii foarte mari',
      'Design digital CAD/CAM cu adaptare marginală perfectă',
      'Aspect natural translucid imposibil de distins de dinții vecini'
    ],
    detailsHtml: `
      <h2>De ce zirconiul este materialul preferat în protetica modernă?</h2>
      <p>Zirconiul elimină complet suportul metalic al coroanelor vechi. Astfel, gingia rămâne sănătoasă, fără umbre întunecate la bază, oferind un zâmbet proaspăt și luminos.</p>
    `,
    faqs: [
      { q: 'Cât durează realizarea unei coroane din zirconiu?', a: 'Procedura durează de obicei între 3 și 7 zile lucrătoare, timp în care pacientul poartă o coroană provizorie.' }
    ]
  }
};

export default function TreatmentDetail() {
  const { treatSlug } = useParams();
  const openPicker = useClinicPicker();
  const item = treatmentData[treatSlug];

  if (!item) {
    return <Navigate to="/tratamente" replace />;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: item.title,
    description: item.description,
    procedureType: item.tag,
    offers: {
      '@type': 'Offer',
      price: item.price.replace(/[^0-9]/g, '') || '1490',
      priceCurrency: 'RON',
      availability: 'https://schema.org/InStock'
    }
  };

  return (
    <div>
      <Seo title={item.title} description={item.description} path={`/${item.slug}`} jsonLd={jsonLd} />

      <PageHero tag={item.tag} title={item.heroTitle} subtitle={item.heroSubtitle} />

      <section className="treatment-detail-sec">
        {/* Item 4: AI Overview Summary Box for SGE / Snippets */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Răspuns AI Overview & Medic Stomatolog</span>
            <span className="sge-ai-tag">Rezumat Medical Instant</span>
          </div>
          <p className="sge-ai-text">{item.aiOverview}</p>
        </div>

        <div className="treatment-detail-grid">
          {/* Main Content Column */}
          <div className="treatment-main-content">
            <div dangerouslySetInnerHTML={{ __html: item.detailsHtml }} />

            <h3>Beneficii Cheie la DentNow:</h3>
            <ul className="benefits-list">
              {item.benefits.map((b) => (
                <li key={b}>✓ {b}</li>
              ))}
            </ul>

            {/* FAQs */}
            <div className="treatment-faqs">
              <h3>Întrebări Frecvente</h3>
              {item.faqs.map((f) => (
                <div key={f.q} className="faq-card">
                  <h4>{f.q}</h4>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Booking Card */}
          <div className="treatment-sidebar-card">
            <div className="price-tag-box">
              <span className="price-label">Preț Promoțional DentNow</span>
              <div className="price-value-row">
                <span className="current-price">{item.price}</span>
                {item.oldPrice && <span className="old-price">{item.oldPrice}</span>}
              </div>
              <span className="rate-hint">Plată în rate fixe prin Card Cumpărături</span>
            </div>

            <div className="sidebar-cta-group">
              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> Programează o Consultație
              </button>
              <a href="https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20detalii%20despre%20tratamentul%20de%20" target="_blank" rel="noopener noreferrer" className="btn btn-outline full-width">
                Întreabă un Medic pe WhatsApp
              </a>
            </div>

            <div className="sidebar-info-list">
              <div><IconClock size={16} color="var(--accent)" /> Consultație inițială cu plan de tratament</div>
              <div><IconAlert size={16} color="var(--accent)" /> Rate fixe fără dobândă</div>
            </div>
          </div>
        </div>

        <div className="treatment-bottom-bar">
          <Link to="/tratamente" className="btn btn-outline">← Înapoi la toate tratamentele</Link>
        </div>
      </section>
    </div>
  );
}
