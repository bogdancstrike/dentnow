import { useClinicPicker } from '../../hooks/useClinicPicker';
import { IconPhone, IconWhatsApp } from '../ui/Icons';
import './Sections.css';

export default function ContactCTA({
  title = 'Programează-te telefonic sau pe WhatsApp',
  subtitle = 'Momentan preluăm programările telefonic și pe WhatsApp. Alege clinica dorită și te punem în legătură cu numărul potrivit.',
}) {
  const openPicker = useClinicPicker();
  return (
    <aside className="contact-cta" aria-label="Contact DentNow">
      <h2 className="contact-cta-title">{title}</h2>
      <p className="contact-cta-sub">{subtitle}</p>
      <div className="contact-cta-actions">
        <button type="button" onClick={() => openPicker('call')} className="contact-cta-call"><IconPhone size={18} /> Suna acum</button>
        <button type="button" onClick={() => openPicker('whatsapp')} className="contact-cta-wa"><IconWhatsApp size={18} /> Scrie pe WhatsApp</button>
      </div>
    </aside>
  );
}
