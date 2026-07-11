import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { IconPhone, IconClock, IconAlert, IconWhatsApp } from '../components/ui/Icons';
import config from '../config';
import './UrgenteDentare.css';

export default function UrgenteDentare() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EmergencyService',
    name: 'DentNow Urgențe Dentare București',
    description: 'Asistență stomatologică rapidă pentru urgențe dentare în București (Dristor, Baba Novac, Prelungirea Ghencea). Tratamente dureri acute și traume.',
    telephone: config.phone,
    url: `${config.social.website}/urgente-dentare-bucuresti`,
    areaServed: 'București',
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
    ]
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
        tag="ASISTENȚĂ DENTARĂ RAPIDĂ"
        title="Urgențe Dentare în București — Scapă Imediat de Durere"
        subtitle="Echipa DentNow este pregătită să preia cazurile urgente: dureri acute, abcese, traume dentare și fracturi."
      />

      <section className="emergency-sec">
        {/* Item 4: AI Overview Summary Box */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Răspuns AI Overview — Protocol Urgențe Dentare</span>
            <span className="sge-ai-tag">Ghid Medical Rapid</span>
          </div>
          <p className="sge-ai-text">
            O urgență dentară necesită intervenție stomatologică imediată pentru a opri durerea acută, a trata infecția (abcesul) sau a salva un dinte avulsionat. La clinica DentNow din București (sediile Dristor & Prelungirea Ghencea), cazurile de urgență au prioritate, oferind anestezie profundă și tratament endodontic sau chirurgical rapid.
          </p>
        </div>

        {/* Quick Call Action Bar */}
        <div className="emergency-call-bar">
          <div className="call-card">
            <h3>Sediul Dristor & Baba Novac</h3>
            <p>Strada Râmnicu Vâlcea nr. 29 & Str. Dristorului 96</p>
            <a href={`tel:${config.phones[0].tel}`} className="btn btn-dark btn-lg">
              <IconPhone size={20} /> Sună Acum: {config.phones[0].display}
            </a>
          </div>

          <div className="call-card">
            <h3>Sediul Prelungirea Ghencea</h3>
            <p>Prelungirea Ghencea nr. 91F, Sector 6</p>
            <a href={`tel:${config.phones[1].tel}`} className="btn btn-dark btn-lg">
              <IconPhone size={20} /> Sună Acum: {config.phones[1].display}
            </a>
          </div>
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
            <a href={`https://wa.me/${config.phones[0].tel.replace('+', '')}?text=Buna%20ziua%2C%20am%20o%20urgenta%20dentara`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <IconWhatsApp size={18} /> Trimite un Mesaj WhatsApp Rapid
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
