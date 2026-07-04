import { useState } from 'react';
import { submitLead } from '../../lib/leadCapture';
import { useToast } from '../../hooks/useToast';
import './Sections.css';

const initial = { name: '', phone: '', email: '', service: '', preferredDay: '', message: '', consent: false };

export default function AppointmentPanel({ title = 'Cere o programare', subtitle = 'Trimite-ne detaliile si revenim cu confirmarea. Fara integrare activa, cererea se deschide in WhatsApp.', selectedService = '', compact = false, source = 'appointment' }) {
  const [form, setForm] = useState({ ...initial, service: selectedService });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const showToast = useToast();

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.consent) {
      setError('Te rugam sa confirmi acordul pentru contactarea ta.');
      return;
    }
    setLoading(true);
    const result = await submitLead({ ...form, source });
    setLoading(false);
    if (result.ok) {
      showToast('Cererea a fost trimisa. Revenim cat mai curand.');
      setForm({ ...initial, service: selectedService });
      return;
    }
    if (result.fallbackUrl) {
      window.open(result.fallbackUrl, '_blank', 'noopener,noreferrer');
      showToast('Am deschis WhatsApp cu detaliile completate.');
      return;
    }
    setError('Cererea nu a putut fi trimisa. Te rugam sa ne suni sau sa incerci din nou.');
  };

  return (
    <aside className={`appointment-panel${compact ? ' compact' : ''}`} aria-label="Formular programare DentNow">
      <h2 className="appointment-title">{title}</h2>
      <p className="appointment-subtitle">{subtitle}</p>
      <form className="appointment-form" onSubmit={onSubmit}>
        <label className="form-group">
          <span className="form-label">Nume</span>
          <input className="form-input" value={form.name} onChange={update('name')} required autoComplete="name" />
        </label>
        <label className="form-group">
          <span className="form-label">Telefon</span>
          <input className="form-input" value={form.phone} onChange={update('phone')} required autoComplete="tel" inputMode="tel" />
        </label>
        <label className="form-group">
          <span className="form-label">Email</span>
          <input className="form-input" value={form.email} onChange={update('email')} autoComplete="email" type="email" />
        </label>
        <label className="form-group">
          <span className="form-label">Serviciu</span>
          <select className="form-select" value={form.service} onChange={update('service')} required>
            <option value="">Alege serviciul</option>
            <option>Consultatie</option>
            <option>Urgenta dentara</option>
            <option>Implantologie</option>
            <option>Igienizare GBT</option>
            <option>Albire dentara</option>
            <option>Ortodontie</option>
            <option>Tratament copii</option>
          </select>
        </label>
        <label className="form-group full">
          <span className="form-label">Interval preferat</span>
          <input className="form-input" value={form.preferredDay} onChange={update('preferredDay')} placeholder="Ex: marti dupa 16:00" />
        </label>
        <label className="form-group full">
          <span className="form-label">Mesaj</span>
          <textarea className="form-textarea" value={form.message} onChange={update('message')} placeholder="Spune-ne pe scurt ce te deranjeaza sau ce tratament te intereseaza." />
        </label>
        <label className="appointment-consent full">
          <input type="checkbox" checked={form.consent} onChange={update('consent')} />
          <span>Sunt de acord sa fiu contactat(a) de DentNow pentru aceasta solicitare.</span>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn btn-dark full" disabled={loading}>{loading ? 'Se trimite...' : 'Trimite solicitarea'}</button>
      </form>
    </aside>
  );
}
