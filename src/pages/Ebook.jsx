import { useEffect, useRef, useState } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import { useToast } from '../hooks/useToast';
import { ebooks } from '../data/content';
import { submitLead } from '../lib/leadCapture';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import './Ebook.css';

export default function Ebook() {
  const ref = useRevealAll([]);
  const showToast = useToast();
  const [dlModal, setDlModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', consent: false });
  const [loading, setLoading] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (dlModal) closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setDlModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dlModal]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const handleDlSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent) {
      showToast('Te rugam sa confirmi acordul pentru contactare.');
      return;
    }
    setLoading(true);
    const result = await submitLead({ ...form, ebook: dlModal, source: 'ebook' });
    setLoading(false);
    if (result.ok) {
      showToast('Solicitarea pentru e-book a fost trimisa.');
      setDlModal(null);
      setForm({ name: '', email: '', consent: false });
      return;
    }
    if (result.fallbackUrl) {
      window.open(result.fallbackUrl, '_blank', 'noopener,noreferrer');
      showToast('Am deschis WhatsApp cu solicitarea completata.');
      return;
    }
    showToast('Nu am putut trimite solicitarea. Incearca telefonic sau pe WhatsApp.');
  };

  return (
    <div ref={ref}>
      <Seo title="E-bookuri DentNow" description="Resurse gratuite DentNow pentru igiena orala, implanturi, estetica si preventie." path="/ebook" />
      <PageHero dark tag="Resurse gratuite" title='E-bookuri <em class="ac">DentNow.</em>' subtitle="Solicita ghidurile prin formular. Fara endpoint activ, cererea se deschide in WhatsApp." />

      <div className="ebook-grid">
        {ebooks.map((eb, i) => (
          <article key={eb.title} className={`ebook-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
            <div className={`ebook-cover ${eb.bg}`}><img src="/assets/dentnow/ebook-cover.svg" alt="Coperta placeholder e-book DentNow" /><span className="ebook-lbl">{eb.label}</span></div>
            <div className="ebook-body">
              <div className="ebook-cat">{eb.cat}</div>
              <h3 className="ebook-title">{eb.title}</h3>
              <p className="ebook-desc">{eb.desc}</p>
              <button className="ebook-dl" onClick={() => setDlModal(eb.title)}>Solicita gratuit</button>
            </div>
          </article>
        ))}
      </div>

      {dlModal && (
        <div className="modal-bg open">
          <div className="modal-box ebook-modal" role="dialog" aria-modal="true" aria-labelledby="ebook-title">
            <button ref={closeRef} onClick={() => setDlModal(null)} className="modal-close" aria-label="Inchide formularul">×</button>
            <h2 id="ebook-title" className="ebook-modal-title">{dlModal}</h2>
            <p className="ebook-modal-copy">Lasa datele si iti trimitem detaliile prin canalul configurat. Daca nu exista endpoint, se deschide WhatsApp.</p>
            <form onSubmit={handleDlSubmit} className="ebook-modal-form">
              <input className="form-input" value={form.name} onChange={update('name')} type="text" placeholder="Numele tau" required />
              <input className="form-input" value={form.email} onChange={update('email')} type="email" placeholder="Email-ul tau" required />
              <label className="appointment-consent"><input type="checkbox" checked={form.consent} onChange={update('consent')} /> <span>Sunt de acord sa fiu contactat(a) pentru aceasta resursa.</span></label>
              <button type="submit" className="btn btn-dark" disabled={loading}>{loading ? 'Se trimite...' : 'Solicita e-bookul'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
