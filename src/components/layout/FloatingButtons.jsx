import config from '../../config';
import { IconWhatsApp, IconPhone } from '../ui/Icons';
import './FloatingButtons.css';

export default function FloatingButtons() {
  return (
    <div className="fab">
      <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="fab-btn fab-wa" title="WhatsApp">
        <IconWhatsApp size={20} color="#fff" /><span className="fab-label">WhatsApp</span>
      </a>
      <a href={`tel:${config.phone}`} className="fab-btn fab-tel" title="Sună acum">
        <IconPhone size={20} color="#fff" /><span className="fab-label">Sună acum</span>
      </a>
    </div>
  );
}
