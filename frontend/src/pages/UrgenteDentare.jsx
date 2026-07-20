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
  const { clinics, links, site } = useSiteData();
  const primaryClinic = clinics[0];
  const primaryLine = clinicPhone(primaryClinic);
  const websiteHref = siteLinkHref(siteLink(links, 'social', 'website')) || window.location.origin;
  const emergencyHours = primaryClinic?.hours || [];
  const schemaWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EmergencyService',
    name: `${site.site_name} Urgențe Dentare București`,
    description: t('urgente.hero.subtitle'),
    telephone: primaryLine?.tel,
    url: new URL('/urgente-dentare-bucuresti', websiteHref).toString(),
    areaServed: 'București',
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
      <Seo
        title="Urgențe Dentare București — Programări Rapide | DentNow"
        description="Ai o urgență dentară sau o durere acută de măsea în București? Sună la DentNow Dristor sau Ghencea. Tratamente rapide fără așteptare."
        path="/urgente-dentare-bucuresti"
        jsonLd={jsonLd}
      />

      <PageHero
        tag={t('urgente.hero.tag')}
        title={t('urgente.hero.title')}
        subtitle={t('urgente.hero.subtitle')}
      />

      <section className="emergency-sec">
        {/* Item 4: AI Overview Summary Box */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Protocol Urgențe Dentare</span>
            <span className="sge-ai-tag">Ghid Medical Rapid</span>
          </div>
          <p className="sge-ai-text">
            O urgență dentară necesită intervenție stomatologică imediată pentru a opri durerea acută, a trata infecția (abcesul) sau a salva un dinte avulsionat. La clinica DentNow din București (sediile Dristor & Prelungirea Ghencea), cazurile de urgență au prioritate, oferind anestezie profundă și tratament endodontic sau chirurgical rapid.
          </p>
        </div>

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
        <div className="triage-container">
          <h2>Ce reprezintă o urgență dentară și ce trebuie să faci:</h2>

          <div className="triage-grid">
            <div className="triage-item">
              <div className="triage-icon"><IconAlert size={24} color="var(--red)" /></div>
              <div>
                <h4>1. Durere acută de măsea / pulpitis</h4>
                <p>Nivele mari de durere pulsatilă care se intensifică noaptea. Clătiți cu apă călduță și luați un analgezic (Ibuprofen / Paracetamol). Nu aplicați aspirină pe gingie!</p>
              </div>
            </div>

            <div className="triage-item">
              <div className="triage-icon"><IconAlert size={24} color="var(--red)" /></div>
              <div>
                <h4>2. Abces dentar și umflătură (edem)</h4>
                <p>Infecție bacteriană avansată la rădăcină. Aplicați o compresă rece pe exteriorul obrazului. Sunați imediat la clinică pentru drenaj și prescripție de antibiotic.</p>
              </div>
            </div>

            <div className="triage-item">
              <div className="triage-icon"><IconAlert size={24} color="var(--red)" /></div>
              <div>
                <h4>3. Dinte scos/avulsionat în urma unui accident</h4>
                <p>Prindeți dintele doar de coroană, nu atingeți rădăcina! Păstrați-l în lapte rece sau ser fiziologic și veniți la dentist în maxim 60 minute pentru reimplantare.</p>
              </div>
            </div>

            <div className="triage-item">
              <div className="triage-icon"><IconAlert size={24} color="var(--red)" /></div>
              <div>
                <h4>4. Proteză sau coroană sărită / fracturată</h4>
                <p>Păstrați piesa protetică. Evitați mestecarea pe partea respectivă și programați-vă pentru cimentare rapidă în aceeași zi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hours & Locations Summary */}
        <div className="emergency-hours-box">
          <h3><IconClock size={20} /> Program de Preluare Urgențe</h3>
          <p>Luni – Vineri: 09:00 – 19:00 | Sâmbătă: 09:00 – 15:00</p>
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
