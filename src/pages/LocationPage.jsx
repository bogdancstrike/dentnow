import { useParams, Navigate } from 'react-router-dom';
import config from '../config';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { IconMapPin, IconPhone, IconClock, IconWhatsApp, IconAlert } from '../components/ui/Icons';
import { useClinicPicker } from '../hooks/useClinicPicker';
import './LocationPage.css';

const locationDetails = {
  dristor: {
    slug: 'dristor',
    title: 'Clinică Stomatologică Dristor — DentNow Râmnicu Vâlcea 29',
    description: 'DentNow Dristor — Cabinet stomatologic modern pe Str. Râmnicu Vâlcea nr. 29. Implanturi, aparate dentare, profilaxie și urgențe stomatologice în Sector 3.',
    name: 'DentNow Dristor',
    subTitle: 'Clinică stomatologică în zona Dristor / Râmnicu Vâlcea (Sector 3)',
    address: 'Strada Râmnicu Vâlcea nr. 29, Bl. 20D, Parter, Ap. 1, Interfon 01',
    postalCode: '031806',
    phoneDisplay: '0720 509 802',
    phoneTel: '+40720509802',
    whatsapp: 'https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow%20Dristor',
    mapsLink: 'https://maps.app.goo.gl/XnpRHcXp5RjKuMoc9',
    embedUrl: 'https://maps.google.com/maps?q=DentNow+Strada+Ramnicu+Valcea+29+Bucuresti&z=16&hl=ro&output=embed',
    transit: [
      { mode: 'Metrou', detail: 'Stația Metrou Dristor 1 / Dristor 2 (5-7 minute de mers pe jos).' },
      { mode: 'Autobuz / Tramvai', detail: 'Linia 330, 135, Tramvai 19, 23 (stația Râmnicu Sărat / Dristorului).' },
      { mode: 'Parcare', detail: 'Locuri de parcare disponibile pe Strada Râmnicu Vâlcea și în proximitate.' }
    ],
    faqs: [
      { q: 'Unde se află exact clinica DentNow Dristor?', a: 'Clinica este situată pe Str. Râmnicu Vâlcea nr. 29, bloc 20D, la parter, ap. 1 (Interfon 01), în apropierea pieței Râmnicu Sărat și a metroului Dristor.' },
      { q: 'Cum pot face o programare la sediul Dristor?', a: 'Puteți suna direct la 0720 509 802 sau ne puteți scrie pe WhatsApp pentru o programare rapidă în aceeași zi.' },
      { q: 'Ce tratamente sunt disponibile la sediul Dristor?', a: 'Servicii complete: implantologie dentară, ortodonție, protetică zirconiu, igienizare GBT, albire laser și stomatologie pediatrică.' }
    ]
  },
  'baba-novac': {
    slug: 'baba-novac',
    title: 'Clinică Stomatologică Baba Novac — DentNow Dristorului 96',
    description: 'DentNow Baba Novac — Cabinet dentar pe Str. Dristorului 96, Sector 3. Servicii stomatologice complete, aparate dentare, implanturi & igienizare.',
    name: 'DentNow Baba Novac',
    subTitle: 'Clinică stomatologică în zona Baba Novac / Dristor (Sector 3)',
    address: 'Strada Dristorului nr. 96, Bl. 12B, Scara B, Parter, Ap. 47',
    postalCode: '031538',
    phoneDisplay: '0720 509 802',
    phoneTel: '+40720509802',
    whatsapp: 'https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow%20Baba%20Novac',
    mapsLink: 'https://maps.app.goo.gl/1VCnsrxEKDYoUykm6',
    embedUrl: 'https://maps.google.com/maps?q=DentNow+Baba+Novac+Strada+Dristorului+96+Bucuresti&z=16&hl=ro&output=embed',
    transit: [
      { mode: 'Metrou', detail: 'Stația Metrou Dristor / Piața Muncii (8 minute de mers pe jos).' },
      { mode: 'Autobuz / Troleibuz', detail: 'Liniile 70, 79, 311 (stația Baba Novac / Dristorului).' },
      { mode: 'Parcare', detail: 'Parcare rezidențială și stradală accesibilă pe Strada Dristorului.' }
    ],
    faqs: [
      { q: 'Unde se află sediul DentNow Baba Novac?', a: 'Adresa exactă este Str. Dristorului nr. 96, bloc 12B, scara B, parter, ap. 47, la intersecția zonelor Baba Novac și Dristor.' },
      { q: 'Aveți servicii de ortodonție și implanturi la Baba Novac?', a: 'Da, oferim consultații de specialitate, aparate dentare fixe/transparente și implantologie cu echipamente moderne.' }
    ]
  },
  'prelungirea-ghencea': {
    slug: 'prelungirea-ghencea',
    title: 'Clinică Stomatologică Prelungirea Ghencea — DentNow Ghencea 91F',
    description: 'DentNow Prelungirea Ghencea 91F — Cabinet stomatologic în Sector 6. Implantologie, stomatologie copii, protetică și igienă dentară.',
    name: 'DentNow Prelungirea Ghencea',
    subTitle: 'Clinică stomatologică modernă în Prelungirea Ghencea (Sector 6)',
    address: 'Prelungirea Ghencea nr. 91F, Bl. 2, Demisol, Ap. 5',
    postalCode: '061715',
    phoneDisplay: '0723 232 263',
    phoneTel: '+40723232263',
    whatsapp: 'https://wa.me/40723232263?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow%20Prelungirea%20Ghencea',
    mapsLink: 'https://maps.app.goo.gl/W9gX6aXMKgV2WbZM8',
    embedUrl: 'https://maps.google.com/maps?q=DentNow+Prelungirea+Ghencea+91F+Bucuresti&z=16&hl=ro&output=embed',
    transit: [
      { mode: 'Autobuz', detail: 'Liniile 122, 222, 385, 422 (stația Valea Oltului / Prelungirea Ghencea).' },
      { mode: 'Tramvai', detail: 'Linia 41 (Ghencea / Drumul Taberei).' },
      { mode: 'Parcare', detail: 'Spații de parcare ușor accesibile în zona ansamblului rezidențial Ghencea 91F.' }
    ],
    faqs: [
      { q: 'Care este numărul de telefon al clinicii din Prelungirea Ghencea?', a: 'Ne puteți contacta direct la 0723 232 263 sau prin mesaj instant pe WhatsApp.' },
      { q: 'Clinica oferă servicii de urgență stomatologică?', a: 'Da, asigurăm tratamente rapide pentru dureri dentare acute, abcese și traume în limita programului de lucru.' }
    ]
  }
};

export default function LocationPage() {
  const { citySlug } = useParams();
  const openPicker = useClinicPicker();
  const loc = locationDetails[citySlug];

  if (!loc) {
    return <Navigate to="/" replace />;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: loc.name,
    description: loc.description,
    url: `${config.social.website}/locatii/${loc.slug}`,
    telephone: loc.phoneTel,
    email: config.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.address,
      addressLocality: 'București',
      postalCode: loc.postalCode,
      addressCountry: 'RO'
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '15:00'
      }
    ],
    hasMap: loc.mapsLink
  };

  return (
    <div>
      <Seo title={loc.title} description={loc.description} path={`/locatii/${loc.slug}`} jsonLd={jsonLd} />
      
      <PageHero tag={`Locație ${loc.name}`} title={loc.name} subtitle={loc.subTitle} />

      <section className="location-detail-sec">
        <div className="location-grid">
          {/* Left info column */}
          <div className="location-info-card">
            <div className="loc-badge">Clinică DentNow</div>
            <h2>Informații & Contact Sediul {loc.name}</h2>
            
            <div className="info-row">
              <IconMapPin size={22} color="var(--accent)" />
              <div>
                <strong>Adresă Clinică:</strong>
                <p>{loc.address}, București</p>
              </div>
            </div>

            <div className="info-row">
              <IconPhone size={22} color="var(--accent)" />
              <div>
                <strong>Telefon Programări:</strong>
                <p><a href={`tel:${loc.phoneTel}`} className="loc-phone-link">{loc.phoneDisplay}</a></p>
              </div>
            </div>

            <div className="info-row">
              <IconClock size={22} color="var(--accent)" />
              <div>
                <strong>Program de Lucru:</strong>
                <p>Luni – Vineri: 09:00 – 19:00<br />Sâmbătă: 09:00 – 15:00<br />Duminică: Închis</p>
              </div>
            </div>

            <div className="loc-actions">
              <a href={`tel:${loc.phoneTel}`} className="btn btn-dark">
                <IconPhone size={18} /> Sună acum ({loc.phoneDisplay})
              </a>
              <a href={loc.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <IconWhatsApp size={18} /> Scrie pe WhatsApp
              </a>
            </div>

            <div className="transit-box">
              <h3><IconAlert size={18} /> Cum ajungi la clinică</h3>
              <ul>
                {loc.transit.map((t) => (
                  <li key={t.mode}>
                    <strong>{t.mode}:</strong> {t.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Map Embed Column */}
          <div className="location-map-card">
            <h3>Harta & Localizare GPS</h3>
            <div className="map-frame-wrapper">
              <iframe
                title={`Harta Google Maps ${loc.name}`}
                src={loc.embedUrl}
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="map-actions">
              <a href={loc.mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline full-width">
                Deschide în Google Maps Navigation ➔
              </a>
            </div>
          </div>
        </div>

        {/* Location FAQ Section */}
        <div className="location-faq-sec">
          <h2>Întrebări Frecvente — {loc.name}</h2>
          <div className="location-faq-list">
            {loc.faqs.map((faq) => (
              <div key={faq.q} className="faq-item">
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="location-cta-banner">
          <h3>Ai nevoie de o consultație la {loc.name}?</h3>
          <p>Echipa noastră de medici dentiști te așteaptă într-un ambient modern și primitor.</p>
          <button type="button" className="btn btn-dark btn-lg" onClick={() => openPicker('both')}>
            Programează-te Online Acum
          </button>
        </div>
      </section>
    </div>
  );
}
