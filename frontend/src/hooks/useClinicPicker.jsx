import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { whatsappUrlFor } from '../lib/leadCapture';
import { IconPhone, IconWhatsApp } from '../components/ui/Icons';
import { useSiteData } from '../public-site/SiteDataProvider';
import './ClinicPicker.css';

const ClinicPickerContext = createContext(() => {});

export const useClinicPicker = () => useContext(ClinicPickerContext);

const TITLES = {
  call: 'La ce clinica suni?',
  whatsapp: 'Ce clinica contactezi pe WhatsApp?',
  both: 'Contacteaza clinica DentNow',
};

function primaryContact(contacts, kind) {
  return contacts.find((contact) => contact.kind === kind && contact.is_primary)
    || contacts.find((contact) => contact.kind === kind);
}

function pickerLocation(clinic) {
  const contacts = clinic.contacts || [];
  const phone = primaryContact(contacts, 'phone');
  const whatsapp = primaryContact(contacts, 'whatsapp');
  const phoneNumber = phone?.normalized_value || whatsapp?.normalized_value;
  const phoneHref = phone?.url?.startsWith('tel:')
    ? phone.url
    : (phone?.normalized_value ? `tel:${phone.normalized_value}` : null);
  const whatsappHref = whatsapp?.url
    || (phoneNumber
      ? whatsappUrlFor(phoneNumber, `Buna ziua, doresc o programare la ${clinic.name}.`)
      : null);

  return {
    name: clinic.name,
    phoneDisplay: phone?.display_value || phoneNumber || 'Contact disponibil',
    phoneHref,
    whatsappHref,
  };
}

export function ClinicPickerProvider({ children }) {
  const { clinics } = useSiteData();
  const [mode, setMode] = useState(null); // 'call' | 'whatsapp' | 'both' | null
  const open = useCallback((nextMode) => setMode(nextMode), []);
  const close = useCallback(() => setMode(null), []);

  useEffect(() => {
    if (!mode) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMode(null); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [mode]);

  const isCall = mode === 'call';
  const isBoth = mode === 'both';
  const locations = clinics
    .map(pickerLocation)
    .filter((location) => {
      if (isBoth) return location.phoneHref || location.whatsappHref;
      return isCall ? location.phoneHref : location.whatsappHref;
    });

  return (
    <ClinicPickerContext.Provider value={open}>
      {children}
      {mode && (
        <div className="clinic-modal-bg">
          <button type="button" className="clinic-modal-backdrop" aria-label="Inchide" onClick={close} />
          <div className="clinic-modal" role="dialog" aria-modal="true" aria-label="Alege clinica DentNow">
            <button className="clinic-modal-close" onClick={close} aria-label="Inchide">×</button>
            <h2 className="clinic-modal-title">{TITLES[mode]}</h2>
            <p className="clinic-modal-sub">Alege clinica DentNow ca sa te punem in legatura cu numarul potrivit.</p>
            <div className="clinic-modal-list">
              {locations.map((loc) => (
                isBoth ? (
                  <div className="clinic-modal-item both" key={loc.name}>
                    <span className="clinic-modal-info">
                      <strong>{loc.name}</strong>
                      <span>{loc.phoneDisplay}</span>
                    </span>
                    <span className="clinic-modal-acts">
                      {loc.phoneHref && <a href={loc.phoneHref} className="clinic-modal-act call" onClick={close} aria-label={`Suna ${loc.name}`} title={`Suna ${loc.name}`}><IconPhone size={18} /></a>}
                      {loc.whatsappHref && <a href={loc.whatsappHref} target="_blank" rel="noopener noreferrer" className="clinic-modal-act wa" onClick={close} aria-label={`WhatsApp ${loc.name}`} title={`WhatsApp ${loc.name}`}><IconWhatsApp size={18} /></a>}
                    </span>
                  </div>
                ) : (
                  <a
                    key={loc.name}
                    href={isCall ? loc.phoneHref : loc.whatsappHref}
                    target={isCall ? undefined : '_blank'}
                    rel={isCall ? undefined : 'noopener noreferrer'}
                    className="clinic-modal-item"
                    onClick={close}
                  >
                    <span className="clinic-modal-icon">{isCall ? <IconPhone size={20} /> : <IconWhatsApp size={20} />}</span>
                    <span className="clinic-modal-info">
                      <strong>{loc.name}</strong>
                      <span>{loc.phoneDisplay}</span>
                    </span>
                    <span className="clinic-modal-go">{isCall ? 'Suna' : 'WhatsApp'} →</span>
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </ClinicPickerContext.Provider>
  );
}
