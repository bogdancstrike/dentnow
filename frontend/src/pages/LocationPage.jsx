import { useParams, useLocation } from 'react-router-dom';
import { IconMapPin, IconPhone, IconClock, IconWhatsApp, IconAlert } from '../components/ui/Icons';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useSiteData } from '../public-site/SiteDataProvider';
import { isPreviewMode, usePreviewDraft } from '../api/previewDraft';
import NotFound from './NotFound';
import './LocationPage.css';
import { siteLink, siteLinkHref } from '../lib/siteContent';
import { clinicWhatsappHref } from '../lib/clinicContact';

export default function LocationPage() {
  const { citySlug } = useParams();
  const location = useLocation();
  const { clinics, links } = useSiteData();
  const clinicDraft = usePreviewDraft('clinic');

  let targetSlug = citySlug;
  if (!targetSlug) {
    if (location.pathname.includes('stomatologie-dristor')) targetSlug = 'dristor';
    else if (location.pathname.includes('stomatologie-baba-novac')) targetSlug = 'baba-novac';
    else if (location.pathname.includes('stomatologie-prelungirea-ghencea')) targetSlug = 'prelungirea-ghencea';
  }

  const savedClinic = clinics.find((c) => c.slug === targetSlug)
    || (clinicDraft?.id ? clinics.find((c) => c.id === clinicDraft.id) : null);
  const backendClinic = clinicDraft
    ? {
        ...(savedClinic || {}),
        ...clinicDraft,
        contacts: clinicDraft.contacts ?? savedClinic?.contacts ?? [],
        hours: clinicDraft.hours ?? savedClinic?.hours ?? [],
        transit: clinicDraft.transit ?? savedClinic?.transit ?? [],
        faqs: clinicDraft.faqs ?? savedClinic?.faqs ?? [],
      }
    : savedClinic;

  if (!backendClinic) {
    return isPreviewMode() ? null : <NotFound />;
  }

  const phoneContact = backendClinic.contacts.find((c) => c.kind === 'phone');
  const whatsappContact = backendClinic.contacts.find((c) => c.kind === 'whatsapp');

  const loc = {
    slug: backendClinic.slug,
    title: `Clinică Stomatologică ${backendClinic.area} — ${backendClinic.name}`,
    description: `DentNow ${backendClinic.area} — Cabinet stomatologic modern pe ${backendClinic.address_full}.`,
    name: backendClinic.name,
    subTitle: `Clinică stomatologică în zona ${backendClinic.area}`,
    address: backendClinic.address_full,
    postalCode: backendClinic.postal_code || '',
    phoneDisplay: phoneContact?.display_value || phoneContact?.normalized_value || '',
    phoneTel: phoneContact?.url?.replace('tel:', '') || phoneContact?.normalized_value || '',
    whatsapp: whatsappContact?.url || clinicWhatsappHref(backendClinic, `Buna ziua, doresc o programare la ${backendClinic.name}.`) || '',
    mapsLink: backendClinic.map_link_url || '',
    embedUrl: backendClinic.map_embed_url || '',
    transit: backendClinic.transit || [],
    faqs: backendClinic.faqs || [],
    hours: backendClinic.hours || [],
  };

  const weekdayNames = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
  const schemaWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const websiteHref = siteLinkHref(siteLink(links, 'social', 'website')) || window.location.origin;
  const email = siteLink(links, 'email');

  const jsonLd = [{
    '@type': 'Dentist',
    name: loc.name,
    description: loc.description,
    url: new URL(`/locatii/${loc.slug}`, websiteHref).toString(),
    telephone: loc.phoneTel,
    email: email?.value || email?.display_value,
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.address,
      addressLocality: 'București',
      postalCode: loc.postalCode,
      addressCountry: 'RO'
    },
    openingHoursSpecification: loc.hours
      .filter((hours) => !hours.closed && hours.opens_at && hours.closes_at)
      .map((hours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: schemaWeekdays[hours.weekday],
        opens: hours.opens_at,
        closes: hours.closes_at,
      })),
    hasMap: loc.mapsLink
  },
  {
    '@type': 'FAQPage',
    mainEntity: loc.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  }];

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
              {loc.phoneTel && <div>
                <strong>Telefon Programări:</strong>
                <p><a href={`tel:${loc.phoneTel}`} className="loc-phone-link">{loc.phoneDisplay}</a></p>
              </div>}
            </div>

            <div className="info-row">
              <IconClock size={22} color="var(--accent)" />
              <div>
                <strong>Program de Lucru:</strong>
                {loc.hours.length > 0 ? (
                  <p>
                    {loc.hours
                      .slice()
                      .sort((a, b) => a.weekday - b.weekday)
                      .map((hours, index) => (
                        <span key={hours.weekday}>
                          {weekdayNames[hours.weekday] || 'Zi'}: {hours.closed
                            ? 'Închis'
                            : `${hours.opens_at?.slice(0, 5) || '—'} – ${hours.closes_at?.slice(0, 5) || '—'}`}
                          {index < loc.hours.length - 1 && <br />}
                        </span>
                      ))}
                  </p>
                ) : <p>Programul va fi confirmat de clinică.</p>}
              </div>
            </div>

            <div className="loc-actions">
              {loc.phoneTel && <a href={`tel:${loc.phoneTel}`} className="btn btn-dark">
                <IconPhone size={18} /> Sună acum ({loc.phoneDisplay})
              </a>}
              {loc.whatsapp && <a href={loc.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <IconWhatsApp size={18} /> Scrie pe WhatsApp
              </a>}
            </div>

            <div className="transit-box">
              <h3><IconAlert size={18} /> Cum ajungi la clinică</h3>
              <ul>
                {loc.transit.map((t) => (
                  <li key={`${t.mode}-${t.label}`}>
                    <strong>{t.label || t.mode}:</strong> {t.detail}
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
          <div className="faqs-grid loc-faqs">
            {loc.faqs.map((f) => (
              <details key={f.question} className="faq-item">
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA — clinic is implied by the page, so act on it directly (no picker). */}
        <div className="location-cta-banner">
          <h3>Ai nevoie de o consultație la {loc.name}?</h3>
          <p>Echipa noastră de medici dentiști te așteaptă într-un ambient modern și primitor.</p>
          <div className="loc-actions" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {loc.phoneTel && <a href={`tel:${loc.phoneTel}`} className="btn btn-dark btn-lg">
              <IconPhone size={18} /> Sună acum ({loc.phoneDisplay})
            </a>}
            {loc.whatsapp && <a href={loc.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
              <IconWhatsApp size={18} /> Programează pe WhatsApp
            </a>}
          </div>
        </div>
      </section>
    </div>
  );
}
