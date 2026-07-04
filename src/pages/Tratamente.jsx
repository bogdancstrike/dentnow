import { useState, useEffect } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { treatmentCategories, jumpNavItems } from '../data/content';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import ContactCTA from '../components/sections/ContactCTA';
import './Tratamente.css';

export default function Tratamente() {
  const revealRef = useRevealAll([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const sections = document.querySelectorAll('.tarife-cat');
    const onScroll = () => {
      let current = '';
      sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 130) current = s.id; });
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={revealRef}>
      <Seo title="Tratamente si tarife DentNow" description="Lista de tratamente stomatologice DentNow, preturi de pornire, pachete si detalii pentru programare." path="/tratamente" />
      <PageHero tag="Tratamente & Tarife" title='Preturi clare, <em class="ac">explicate inainte.</em>' subtitle="Preturile sunt orientative si se confirma prin deviz dupa consult. Actualizat: Iulie 2026." />

      <div className="jump-nav">
        {jumpNavItems.map((j) => <a key={j.id} href={`#${j.id}`} className={`jump-btn${activeId === j.id ? ' active' : ''}`}>{j.label}</a>)}
      </div>

      <div className="tarife-wrap">
        <div className="cas-banner rv">
          <span className="banner-mark">CAS</span>
          <div>
            <div className="banner-title">Lucram cu CAS - Cardul de Sanatate</div>
            <p>Acoperirea depinde de eligibilitate si de serviciile disponibile. Copiii pot beneficia de servicii decontate conform regulilor CAS.</p>
          </div>
        </div>

        {treatmentCategories.map((cat) => (
          <section className="tarife-cat rv" id={cat.id} key={cat.id}>
            <div className="cat-head">
              <h2 className="cat-title">{cat.title}</h2>
              <a href="#programare-tratamente" className="btn btn-outline btn-sm">Cere programare</a>
            </div>
            <div className="tarife-table">
              {cat.rows.map((row) => (
                <div key={row.name} className={`t-row${row.promo ? ' promo' : ''}`}>
                  <span className="tr-name">{row.name}{row.promo && <span className="promo-tag">PROMO</span>}</span>
                  {row.oldPrice && <span className="tr-old">{row.oldPrice}</span>}
                  <span className={`tr-price${row.promo ? ' promo-p' : ''}`}>{row.price}</span>
                </div>
              ))}
            </div>
            {cat.note && <p className="cat-note">{cat.note}</p>}
            {cat.casNote && <div className="cas-note"><strong>{cat.casNote}</strong></div>}
          </section>
        ))}

        <div className="payment-box rv">
          <span className="banner-mark">Rate</span>
          <div>
            <div className="banner-title">Plata in rate - de confirmat cu clinica</div>
            <p>Conditiile de plata trebuie validate de clinica inainte de publicare.</p>
            <a href={`tel:${config.phone}`} className="btn btn-dark btn-sm">{config.phoneDisplay}</a>
          </div>
        </div>

        <div id="programare-tratamente" className="tarife-appointment rv">
          <ContactCTA title="Programează-te pentru tratament" service="Consultatie" source="tratamente" />
        </div>
      </div>
    </div>
  );
}
