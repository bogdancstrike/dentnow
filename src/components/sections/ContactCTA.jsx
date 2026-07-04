import config from '../../config';
import { buildWhatsAppLeadUrl } from '../../lib/leadCapture';
import { IconPhone, IconWhatsApp } from '../ui/Icons';
import './Sections.css';

export default function ContactCTA({
  title = 'Programează-te telefonic sau pe WhatsApp',
  subtitle = 'Momentan preluăm programările telefonic și pe WhatsApp. Îți răspundem rapid și confirmăm intervalul disponibil.',
  service = '',
  source = 'contact cta',
}) {
  const waUrl = buildWhatsAppLeadUrl({ source, service });
  return (
    <aside className="contact-cta" aria-label="Contact DentNow">
      <h2 className="contact-cta-title">{title}</h2>
      <p className="contact-cta-sub">{subtitle}</p>
      <div className="contact-cta-actions">
        <a href={`tel:${config.phone}`} className="contact-cta-call"><IconPhone size={18} /> {config.phoneDisplay}</a>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="contact-cta-wa"><IconWhatsApp size={18} /> Scrie pe WhatsApp</a>
      </div>
    </aside>
  );
}
