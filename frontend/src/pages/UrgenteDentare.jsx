import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { IconPhone, IconClock, IconAlert, IconWhatsApp } from '../components/ui/Icons';
import { useSiteData } from '../public-site/SiteDataProvider';
import { clinicPhone } from '../lib/clinicContact';
import './UrgenteDentare.css';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { siteLink, siteLinkHref } from '../lib/siteContent';

export default function UrgenteDentare() {
  const t = useSiteTexts();
  const openPicker = useClinicPicker();
  const { clinics, links, site, pages } = useSiteData();
  const primaryClinic = clinics[0];
  const primaryLine = clinicPhone(primaryClinic);
  const websiteHref = siteLinkHref(siteLink(links, 'social', 'website')) || window.location.origin;
  const emergencyHours = primaryClinic?.hours || [];
  const sections = pages?.['/urgente-dentare-bucuresti']?.sections || [];
  const section = (blockType) => sections.find((item) => item.block_type === blockType)?.payload || {};
  const overview = section('emergency_overview');
  const triage = section('emergency_triage');
  const hoursContent = section('emergency_hours');
  const schemaWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EmergencyService',
    name: `${site.site_name} ${t('urgente.hero.tag')}`,
    description: t('urgente.hero.subtitle'),
    telephone: primaryLine?.tel,
    url: new URL('/urgente-dentare-bucuresti', websiteHref).toString(),
    openingHoursSpecification: emergencyHours
      .filter((hours) => !hours.closed && hours.opens_at && hours.closes_at)
      .map((hours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: schemaWeekdays[hours.weekday],
        opens: hours.opens_at,
        closes: hours.closes_at,
      })),
  };

  return (
    <div>
      <Seo path="/urgente-dentare-bucuresti" jsonLd={jsonLd} />

      <PageHero
        tag={t('urgente.hero.tag')}
        title={t('urgente.hero.title')}
        subtitle={t('urgente.hero.subtitle')}
      />

      <section className="emergency-sec">
        {/* Item 4: AI Overview Summary Box */}
        {(overview.text || overview.label || overview.tag) && <div className="sge-ai-box">
          <div className="sge-ai-header">
            {overview.label && <span className="sge-ai-badge">{overview.label}</span>}
            {overview.tag && <span className="sge-ai-tag">{overview.tag}</span>}
          </div>
          {overview.text && <p className="sge-ai-text">{overview.text}</p>}
        </div>}

        {/* Quick Call Action Bar */}
        <div className="emergency-call-bar">
          {clinics.map((clinic) => {
            const line = clinicPhone(clinic);
            if (!line) return null;
            return (
              <div className="call-card" key={clinic.slug}>
                <h3>{clinic.name}</h3>
                <p>{clinic.address_full || clinic.area}</p>
                <a href={`tel:${line.tel}`} className="btn btn-dark btn-lg">
                  <IconPhone size={20} /> Sună Acum: {line.display}
                </a>
              </div>
            );
          })}
        </div>

        {/* Emergency Triage Checklist */}
        {Array.isArray(triage.items) && triage.items.length > 0 && <div className="triage-container">
          {triage.title && <h2>{triage.title}</h2>}

          <div className="triage-grid">
            {triage.items.map((item, index) => <div className="triage-item" key={`${item.title}-${index}`}>
              <div className="triage-icon"><IconAlert size={24} color="var(--red)" /></div>
              <div>
                <h4>{index + 1}. {item.title}</h4>
                {item.text && <p>{item.text}</p>}
              </div>
            </div>)}
          </div>
        </div>}

        {/* Hours & Locations Summary */}
        <div className="emergency-hours-box">
          <h3><IconClock size={20} /> {hoursContent.title}</h3>
          {clinics.map((clinic) => <p key={clinic.slug}>
            <strong>{clinic.name}:</strong>{' '}
            {(clinic.hours || [])
              .filter((hours) => !hours.closed && hours.opens_at && hours.closes_at)
              .map((hours) => `${schemaWeekdays[hours.weekday]} ${hours.opens_at.slice(0, 5)}–${hours.closes_at.slice(0, 5)}`)
              .join(' · ')}
          </p>)}
          <div className="hours-whatsapp">
            <button type="button" onClick={() => openPicker('whatsapp')} className="btn btn-whatsapp">
              <IconWhatsApp size={18} /> Trimite un Mesaj WhatsApp Rapid
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
