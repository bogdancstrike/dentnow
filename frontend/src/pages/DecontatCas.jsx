import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import config from '../config';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { IconPhone, IconClock, IconAlert, IconWhatsApp, IconMapPin } from '../components/ui/Icons';
import { useSiteData } from '../public-site/SiteDataProvider';
import { clinicPhone } from '../lib/clinicContact';
import './DecontatCas.css';

import { faqs as staticFaqs, steps as staticSteps } from '../data/cas';

export default function DecontatCas() {
  const openPicker = useClinicPicker();
  const { decontat_cas: cas, clinics } = useSiteData();
  const steps = cas?.steps?.length ? cas.steps.map((s) => ({ title: s.title, text: s.text || '' })) : staticSteps;
  const faqs = cas?.faqs?.length ? cas.faqs : staticFaqs;

  const jsonLd = [
    {
      '@type': 'MedicalProcedure',
      name: 'Tratamente Dentare Decontate CAS DentNow',
      description:
        'Servicii stomatologice decontate prin Casa Națională de Asigurări de Sănătate (CAS) și stomatologie gratuită pentru copii la DentNow București.',
      procedureType: 'Pedodonție & Prevenție CAS'
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
  ];

  return (
    <div>
      <Seo
        title="Tratamente Dentare Decontate CAS & Stomatologie Copii Gratuit | DentNow"
        description="Beneficiază de servicii stomatologice GRATUITE pentru copii și tratamente decontate prin CAS la clinica DentNow din București. Află actele necesare!"
        path="/decontat-cas"
        jsonLd={jsonLd}
      />

      <PageHero
        tag="SERVICII DECONTATE CAS & GRATUITĂȚI PEDIATRIE"
        title="Tratamente Dentare Decontate prin CAS & Stomatologie Gratuită pentru Copii"
        subtitle="DentNow este în contract cu Casa de Asigurări de Sănătate (CAS), oferind gratuități pentru copii și decontări la servicii stomatologice uzuale."
      />

      <section className="cas-sec">
        {/* AI Overview Summary Box */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Decontare CAS DentNow</span>
            <span className="sge-ai-tag">Ghid Asigurați CAS</span>
          </div>
          <p className="sge-ai-text">
            Persoanele asigurate în sistemul public de sănătate din România și copiii cu vârsta de până la 18 ani beneficiază de tratamente stomatologice decontate integral (100% gratuit) sau parțial prin CAS la clinica DentNow. Serviciile gratuite pentru copii includ consultații, obturații (plombe), sigilări și extracții de dinți temporari.
          </p>
        </div>

        {/* Quick facts strip */}
        <div className="cas-stats">
          <div className="cas-stat">
            <strong>100% Gratuit</strong>
            <span>Stomatologie pentru copii 0 – 18 ani</span>
          </div>
          <div className="cas-stat">
            <strong>3 Clinici</strong>
            <span>Dristor · Baba Novac · Prel. Ghencea</span>
          </div>
          <div className="cas-stat">
            <strong>Fără Dosare</strong>
            <span>Decontarea se face direct de clinică</span>
          </div>
        </div>

        <div className="cas-grid">
          {/* Main CAS Content */}
          <div className="cas-main">
            <h2>Stomatologie Gratuită pentru Copii (0 – 18 Ani)</h2>
            <p>Sănătatea dentară a copiilor este o prioritate la DentNow. Prin contractul cu CAS, copiii primesc îngrijire pediatrică de specialitate fără niciun cost pentru părinți:</p>

            <ul className="cas-benefits-list">
              <li><strong>Consultație de specialitate pedodonție:</strong> Gratuită 100%</li>
              <li><strong>Obturații (plombe) dinți de lapte și definitivi:</strong> Decontate integral</li>
              <li><strong>Sigilarea șanțurilor și fosetelor (prevenirea cariilor):</strong> Decontată CAS</li>
              <li><strong>Extracții dinți temporari:</strong> Gratuit prin CAS</li>
              <li><strong>Igienizare & Fluorizare:</strong> Inclusă în abonamentul preventiv</li>
            </ul>

            <h2>Tratamente Decontate pentru Adulți Asigurați</h2>
            <p>Pachetul de servicii decontate prin Casa de Asigurări de Sănătate acoperă o gamă largă de tratamente de bază:</p>

            <div className="cas-services-cards">
              <div className="cas-card">
                <h3>Consultație & Diagnostic</h3>
                <p>Evaluare parodontală și stabilirea planului de tratament decontată 100%.</p>
              </div>

              <div className="cas-card">
                <h3>Obturații Fizionomice</h3>
                <p>Tratamentul cariilor simple decontat conform plafonului CAS lunar.</p>
              </div>

              <div className="cas-card">
                <h3>Extracții Dentare</h3>
                <p>Extracții dinți monoradiculari și pluriradiculari decontate parțial sau integral.</p>
              </div>
            </div>

            <h2>Cum funcționează decontarea, în 3 pași</h2>
            <div className="cas-steps">
              {steps.map((s, i) => (
                <div key={s.title} className="cas-step">
                  <span className="cas-step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>

            <h2>Acte necesare pentru programarea CAS</h2>
            <div className="cas-docs-grid">
              <div className="cas-doc-card">
                <h3>Pentru Copii</h3>
                <p>Certificat de naștere (sau Carte de Identitate dacă are peste 14 ani) și buletinul unuia dintre părinți.</p>
              </div>
              <div className="cas-doc-card">
                <h3>Pentru Adulți Asigurați</h3>
                <p>Carte de Identitate (CI) și dovadă de asigurat: adeverință de salariat, talon de pensie sau Card de Sănătate.</p>
              </div>
            </div>

            <div className="cas-note">
              <IconAlert size={20} />
              <p>
                <strong>Bine de știut:</strong> plafonul lunar decontat de CAS este limitat per clinică. Dacă plafonul lunii curente s-a epuizat, te programăm cu prioritate imediat ce se deblochează fondurile lunii următoare.
              </p>
            </div>

            <h2>Întrebări frecvente despre decontarea CAS</h2>
            <div className="cas-faq-list">
              {faqs.map((f) => (
                <div key={f.q} className="cas-faq-item">
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar CTA Card */}
          <aside className="cas-sidebar">
            <div className="cas-cta-card">
              <h3>Programează-te cu Decontare CAS</h3>
              <p>Plafoanele lunare decontate de CAS sunt limitate! Vă recomandăm să vă programați din timp, la începutul lunii.</p>

              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> Programează-te la DentNow
              </button>

              <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp full-width cas-wa-btn">
                <IconWhatsApp size={18} /> Întreabă-ne pe WhatsApp
              </a>

              <div className="cas-phone-lines">
                {clinics.map((clinic) => {
                  const line = clinicPhone(clinic);
                  if (!line) return null;
                  return (
                    <a key={clinic.slug} href={`tel:${line.tel}`} className="cas-phone-line">
                      <IconMapPin size={16} color="var(--accent)" />
                      <span>
                        <small>{clinic.name}</small>
                        <strong>{line.display}</strong>
                      </span>
                    </a>
                  );
                })}
              </div>

              <div className="cas-contact-info">
                <div><IconClock size={16} color="var(--accent)" /> Luni – Vineri: 09:00 – 19:00 · Sâmbătă: 09:00 – 15:00</div>
                <div><IconAlert size={16} color="var(--green)" /> Decontare 100% pentru copii sub 18 ani</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom CTA banner */}
        <div className="cas-cta-banner">
          <h2>Programează un consult decontat CAS</h2>
          <p>Verificăm plafonul disponibil și îți confirmăm programarea în aceeași zi, în oricare dintre cele 3 clinici DentNow din București.</p>
          <div className="cas-banner-actions">
            <button type="button" className="btn btn-white btn-lg" onClick={() => openPicker('both')}>
              <IconPhone size={18} /> Sună pentru programare
            </button>
            <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white btn-lg">
              <IconWhatsApp size={18} /> Scrie-ne pe WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
