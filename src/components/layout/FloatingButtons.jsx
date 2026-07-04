import config from '../../config';
import { IconWhatsApp, IconPhone } from '../ui/Icons';
import './FloatingButtons.css';

export default function FloatingButtons() {
  return (
    <div className="fab" aria-label="Actiuni rapide DentNow">
      <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="fab-btn fab-wa" title="WhatsApp">
        <IconWhatsApp size={20} /><span className="fab-label">WhatsApp</span>
      </a>
      <a href={`tel:${config.phone}`} className="fab-btn fab-tel" title="Suna acum">
        <IconPhone size={20} /><span className="fab-label">Suna acum</span>
      </a>
    </div>
  );
}
