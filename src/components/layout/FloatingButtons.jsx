import { IconWhatsApp, IconPhone } from '../ui/Icons';
import { useClinicPicker } from '../../hooks/useClinicPicker';
import './FloatingButtons.css';

export default function FloatingButtons() {
  const openPicker = useClinicPicker();
  return (
    <div className="fab" aria-label="Actiuni rapide DentNow">
      <button type="button" onClick={() => openPicker('whatsapp')} className="fab-btn fab-wa" title="WhatsApp">
        <IconWhatsApp size={20} /><span className="fab-label">WhatsApp</span>
      </button>
      <button type="button" onClick={() => openPicker('call')} className="fab-btn fab-tel" title="Suna acum">
        <IconPhone size={20} /><span className="fab-label">Suna acum</span>
      </button>
    </div>
  );
}
