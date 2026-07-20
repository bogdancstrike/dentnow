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
import { usePreviewDraft } from '../api/previewDraft';

export default function Tratamente() {
  const t = useSiteTexts();
  const openPicker = useClinicPicker();
  const [activeId, setActiveId] = useState('');

  const { data: treatments = [], isLoading } = useQuery({
    queryKey: publicQueryKeys.treatments,
    queryFn: fetchTreatments,
  });
  const treatmentDraft = usePreviewDraft('treatment');
  const previewTreatments = treatmentDraft
    ? (() => {
        const index = treatments.findIndex((item) =>
          (treatmentDraft.id && item.id === treatmentDraft.id)
          || (treatmentDraft.slug && item.slug === treatmentDraft.slug),
        );
        if (index < 0) return [...treatments, { ...treatmentDraft, prices: treatmentDraft.prices || [] }];
        return treatments.map((item, itemIndex) => itemIndex === index ? { ...item, ...treatmentDraft } : item);
      })()
    : treatments;

  const revealRef = useRevealAll([previewTreatments]);

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
  }, [previewTreatments]);

  const categories = [];
  const catMap = new Map();

  previewTreatments.forEach((t) => {
    const catName = t.category_label || 'Altele';
    const catSlug = t.category_slug || 'altele';
    if (!catMap.has(catName)) {
      catMap.set(catName, { id: catSlug, title: catName, rows: [] });
      categories.push(catMap.get(catName));
    }
    const cat = catMap.get(catName);
    const prices = t.prices?.length ? t.prices : [{ price_kind: 'on_request' }];
    prices.forEach((p) => {
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
      <Seo path="/tratamente" />
      <PageHero tag={t('tratamente.hero.tag')} title={t('tratamente.hero.title')} subtitle={t('tratamente.hero.subtitle')} />

      <div className="jump-nav">
        {jumpNavItems.map((j) => <a key={j.id} href={`#${j.id}`} className={`jump-btn${activeId === j.id ? ' active' : ''}`}>{j.label}</a>)}
      </div>

      <div className="tarife-wrap">
        <div className="cas-banner rv">
          <span className="banner-mark">CAS</span>
          <div>
            <div className="banner-title">{t('tratamente.cas.title')}</div>
            <p>{t('tratamente.cas.text')}</p>
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
            <div className="banner-title">{t('tratamente.payment.title')}</div>
            <p>{t('tratamente.payment.text')}</p>
            <button type="button" onClick={() => openPicker('call')} className="btn btn-dark btn-sm">Suna acum</button>
          </div>
        </div>

        <div id="programare-tratamente" className="tarife-appointment rv">
          <ContactCTA title={t('tratamente.cta.title')} service="Consultatie" source="tratamente" />
        </div>
      </div>
    </div>
  );
}
