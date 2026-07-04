import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { IconPhone, IconClock, IconAlert } from '../components/ui/Icons';
import './DecontatCas.css';

export default function DecontatCas() {
  const openPicker = useClinicPicker();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: 'Tratamente Dentare Decontate CAS DentNow',
    description: 'Servicii stomatologice decontate prin Casa Națională de Asigurări de Sănătate (CAS) și stomatologie gratuită pentru copii la DentNow București.',
    procedureType: 'Pedodonție & Prevenție CAS'
  };

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
        {/* Item 4: AI Overview Summary Box */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Răspuns AI Overview — Decontare CAS DentNow</span>
            <span className="sge-ai-tag">Ghid Asigurați CAS</span>
          </div>
          <p className="sge-ai-text">
            Persoanele asigurate în sistemul public de sănătate din România și copiii cu vârsta de până la 18 ani beneficiază de tratamente stomatologice decontate integral (100% gratuit) sau parțial prin CAS la clinica DentNow. Serviciile gratuite pentru copii includ consultații, obturații (plombe), sigilări și extracții de dinți temporari.
          </p>
        </div>

        <div className="cas-grid">
          {/* Main CAS Content */}
          <div className="cas-main">
            <h2>Stomatologie Gratuită pentru Copii (0 - 18 Ani)</h2>
            <p>Sănătatea dentară a copiilor este o prioritate la DentNow. Prin contractul cu CAS, copiii primesc îngrijire pediatrică de specialitate fără niciun cost pentru părinți:</p>

            <ul className="cas-benefits-list">
              <li>✓ <strong>Consultație de specialitate pedodonție:</strong> Gratuită 100%</li>
              <li>✓ <strong>Obturații (plombe) dinți de lapte și definitivi:</strong> Decontate integral</li>
              <li>✓ <strong>Sigilarea șanțurilor și fosetelor (prevenirea cariilor):</strong> Decontată CAS</li>
              <li>✓ <strong>Extracții dinți temporari:</strong> Gratuit prin CAS</li>
              <li>✓ <strong>Igienizare & Fluorizare:</strong> Inclusă în abonamentul preventiv</li>
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

            <h2>Acte necesare pentru programarea CAS:</h2>
            <ol className="cas-docs-list">
              <li><strong>Pentru Copii:</strong> Certificat de naștere (sau Carte de Identitate dacă are peste 14 ani) și buletinul unuia dintre părinți.</li>
              <li><strong>Pentru Adulți Asigurați:</strong> Carte de Identitate (CI) și dovadă de asigurat (Adeverință de salariat / Talon de pensie / Card de Sănătate).</li>
            </ol>
          </div>

          {/* Sidebar CTA Card */}
          <div className="cas-sidebar">
            <div className="cas-cta-card">
              <h3>Programează-te cu Decontare CAS</h3>
              <p>Plafoanele lunare decontate de CAS sunt limitate! Vă recomandăm să vă programați din timp la începutul lunii.</p>

              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> Programează-te la DentNow
              </button>

              <div className="cas-contact-info">
                <div><IconClock size={16} color="var(--accent)" /> Luni – Vineri: 09:00 – 19:00</div>
                <div><IconAlert size={16} color="var(--green)" /> Decontare 100% pentru copii sub 18 ani</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
