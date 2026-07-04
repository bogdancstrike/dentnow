import { useState, useEffect } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { treatmentCategories, jumpNavItems } from '../data/content';
import PageHero from '../components/ui/PageHero';
import './Tratamente.css';

export default function Tratamente() {
  const revealRef = useRevealAll([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const sections = document.querySelectorAll('.tarife-cat');
    const onScroll = () => {
      let current = '';
      sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={revealRef}>
      <PageHero tag="Tratamente & Tarife" title='Transparență <em class="ac">totală.</em>' subtitle="Prețuri clare, fără costuri ascunse. Deviz detaliat înainte de orice tratament." />

      <div className="jump-nav">
        {jumpNavItems.map((j) => (
          <a key={j.id} href={`#${j.id}`} className={`jump-btn${activeId === j.id ? ' active' : ''}`}>{j.label}</a>
        ))}
      </div>

      <div className="tarife-wrap">
        <div className="cas-banner rv">
          <span style={{ fontSize: 32, flexShrink: 0 }}>💳</span>
          <div>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>Lucrăm cu CAS — Cardul de Sănătate</div>
            <p style={{ fontSize: 15, color: '#2d6e40', lineHeight: 1.6 }}>Acceptăm cardul de sănătate. <strong>Copii — servicii GRATUITE.</strong></p>
          </div>
        </div>

        {treatmentCategories.map((cat) => (
          <div className="tarife-cat rv" id={cat.id} key={cat.id}>
            <h2 className="cat-title">{cat.title}</h2>
            <div className="tarife-table">
              {cat.rows.map((row, i) => (
                <div key={i} className={`t-row${row.promo ? ' promo' : ''}`}>
                  <span className="tr-name">{row.name}{row.promo && <span className="promo-tag">PROMO</span>}</span>
                  <span className="tr-old">{row.oldPrice || ''}</span>
                  <span className={`tr-price${row.promo ? ' promo-p' : ''}`}>{row.price}</span>
                </div>
              ))}
            </div>
            {cat.note && <p style={{ fontSize: 14, color: 'var(--gray)', marginTop: 12, padding: '0 4px' }}>{cat.note}</p>}
            {cat.casNote && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid #b4dfc0', borderRadius: 'var(--rs)', padding: '16px 20px', marginTop: 12, fontSize: 14, color: '#2d6e40' }}>
                ✅ <strong>{cat.casNote}</strong>
              </div>
            )}
          </div>
        ))}

        <div className="payment-box rv">
          <span style={{ fontSize: 36, flexShrink: 0 }}>💳</span>
          <div>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Plată în rate disponibilă</div>
            <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 20 }}>Oferim planuri de plată flexibile. Contactați-ne pentru detalii.</p>
            <a href={`tel:${config.phone}`} className="btn btn-dark btn-sm">📞 {config.phoneDisplay}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
