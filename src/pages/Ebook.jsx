import { useState } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import { useToast } from '../hooks/useToast';
import { ebooks } from '../data/content';
import PageHero from '../components/ui/PageHero';
import './Ebook.css';

export default function Ebook() {
  const ref = useRevealAll([]);
  const showToast = useToast();
  const [dlModal, setDlModal] = useState(null);

  const handleDlSubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Se trimite...';
    setTimeout(() => {
      btn.textContent = '✓ E-bookul va fi trimis în curând!';
      btn.style.background = '#1a7a3a';
      setTimeout(() => {
        setDlModal(null);
        btn.disabled = false;
        btn.textContent = 'Trimite-mi e-bookul gratuit →';
        btn.style.background = '';
        e.target.reset();
        showToast('✓ E-bookul va fi trimis pe email-ul tău în curând!');
      }, 2500);
    }, 1200);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    showToast('✓ Toate e-bookurile vor fi trimise pe email-ul tău!');
    e.target.reset();
  };

  return (
    <div ref={ref}>
      <PageHero dark tag="Resurse Gratuite" title='E-Bookuri <em class="ac">gratuite.</em>' subtitle="Descarcă ghiduri practice, elaborate de medicii DentNow. 100% gratuit." />

      <div className="ebook-grid">
        {ebooks.map((eb, i) => (
          <div key={i} className={`ebook-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
            <div className={`ebook-cover ${eb.bg}`}><span>{eb.icon}</span><span className="ebook-lbl">{eb.label}</span></div>
            <div className="ebook-body">
              <div className="ebook-cat">{eb.cat}</div>
              <h3 className="ebook-title">{eb.title}</h3>
              <p className="ebook-desc">{eb.desc}</p>
              <button className="ebook-dl" onClick={() => setDlModal(eb.title)}>📥 Descarcă gratuit ›</button>
            </div>
          </div>
        ))}
      </div>

      <div className="email-capture rv">
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h3 className="h3d" style={{ marginBottom: 12 }}>Primește toate e-bookurile pe email</h3>
        <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.6 }}>Lasă adresa ta de email și îți trimitem instantaneu toate cele 6 e-bookuri gratuite.</p>
        <form className="email-form" onSubmit={handleEmailSubmit}>
          <input className="form-input" type="email" placeholder="email@exemplu.ro" required />
          <button type="submit" className="btn btn-dark" style={{ whiteSpace: 'nowrap', padding: '13px 28px' }}>Trimite →</button>
        </form>
      </div>

      {dlModal && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }} onClick={(e) => e.target === e.currentTarget && setDlModal(null)}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', maxWidth: 500, width: '100%', padding: 48, textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setDlModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg)', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: 52, marginBottom: 20 }}>📥</div>
            <h3 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{dlModal}</h3>
            <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>Lasă adresa de email pentru a primi e-bookul gratuit.</p>
            <form onSubmit={handleDlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="form-input" type="text" placeholder="Numele tău" required />
              <input className="form-input" type="email" placeholder="Email-ul tău" required />
              <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }}>Trimite-mi e-bookul gratuit →</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
