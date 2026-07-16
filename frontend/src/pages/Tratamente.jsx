import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTreatments, publicQueryKeys } from '../api/publicClient';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import ContactCTA from '../components/sections/ContactCTA';
import './Tratamente.css';
import { useSiteTexts } from '../hooks/useSiteTexts';

export default function Tratamente() {
  const t = useSiteTexts();
  const openPicker = useClinicPicker();
  const [activeId, setActiveId] = useState('');

  const { data: treatments = [], isLoading } = useQuery({
    queryKey: publicQueryKeys.treatments,
    queryFn: fetchTreatments,
  });

  const revealRef = useRevealAll([treatments]);

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
  }, [treatments]);

  const categories = [];
  const catMap = new Map();

  treatments.forEach((t) => {
    const catName = t.category_label || 'Altele';
    const catSlug = t.category_slug || 'altele';
    if (!catMap.has(catName)) {
      catMap.set(catName, { id: catSlug, title: catName, rows: [] });
      categories.push(catMap.get(catName));
    }
    const cat = catMap.get(catName);
    t.prices.forEach((p) => {
      cat.rows.push({
        name: t.name,
        slug: t.slug,
        price: p.amount ? `${p.amount} ${p.currency}` : 'La cerere',
        oldPrice: p.old_amount ? `${p.old_amount} ${p.currency}` : null,
        promo: !!p.old_amount,
      });
    });
  });

  const jumpNavItems = categories.map((cat) => ({ id: cat.id, label: cat.title }));

  return (
    <div ref={revealRef}>
      <Seo title="Tratamente si tarife DentNow" description="Lista de tratamente stomatologice DentNow, preturi de pornire, pachete si detalii pentru programare." path="/tratamente" />
      <PageHero tag={t('tratamente.hero.tag')} title={t('tratamente.hero.title')} subtitle={t('tratamente.hero.subtitle')} />

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

        {isLoading && <div style={{ padding: '2rem', textAlign: 'center' }}>Se incarca tratamentele...</div>}
        {categories.map((cat) => (
          <section className="tarife-cat rv" id={cat.id} key={cat.id}>
            <div className="cat-head">
              <h2 className="cat-title">{cat.title}</h2>
              <a href="#programare-tratamente" className="btn btn-outline btn-sm">Cere programare</a>
            </div>
            <div className="tarife-table">
              {cat.rows.map((row, idx) => (
                <div
                  key={`${row.name}-${idx}`}
                  className={`t-row${row.promo ? ' promo' : ''}`}
                  data-analytics-type="treatment"
                  data-analytics-key={row.slug}
                >
                  <span className="tr-name">{row.name}{row.promo && <span className="promo-tag">PROMO</span>}</span>
                  {row.oldPrice && <span className="tr-old">{row.oldPrice}</span>}
                  <span className={`tr-price${row.promo ? ' promo-p' : ''}`}>{row.price}</span>
                </div>
              ))}
            </div>
            {cat.note && <p className="cat-note">{cat.note}</p>}
          </section>
        ))}

        <div className="payment-box rv">
          <span className="banner-mark">Rate</span>
          <div>
            <div className="banner-title">Plata in rate - de confirmat cu clinica</div>
            <p>Conditiile de plata trebuie validate de clinica inainte de publicare.</p>
            <button type="button" onClick={() => openPicker('call')} className="btn btn-dark btn-sm">Suna acum</button>
          </div>
        </div>

        <div id="programare-tratamente" className="tarife-appointment rv">
          <ContactCTA title="Programează-te pentru tratament" service="Consultatie" source="tratamente" />
        </div>
      </div>
    </div>
  );
}
