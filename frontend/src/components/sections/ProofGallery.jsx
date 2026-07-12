import { useState } from 'react';
import { clinicGallery } from '../../data/clinicProof';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { mediaUrl } from '../../api/publicClient';
import './Sections.css';

export default function ProofGallery({ items: itemsProp }) {
  const { gallery } = useSiteData();
  const items = itemsProp ?? (gallery && gallery.length > 0
    ? gallery.map((g) => ({
        src: g.media_id ? mediaUrl(g.media_id, 'hero') : (g.image_url || '/assets/dentnow/clinic-exterior.svg'),
        alt: g.alt_text || g.title,
        title: g.title,
        caption: g.caption || '',
      }))
    : clinicGallery);
  const [index, setIndex] = useState(0);
  const current = items[index];
  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <section className="section-wrap alt" id="clinica">
      <div className="section-inner">
        <div className="section-kicker">Clinica</div>
        <h2 className="section-title">Un spatiu clinic clar, curat si usor de recunoscut.</h2>
        <p className="section-lead">Aceste imagini sunt placeholders puse in acelasi director. Cand ai fotografiile reale, le inlocuiesti pastrand aceleasi nume sau actualizezi `clinicProof.js`.</p>
        <div className="gallery-shell">
          <div>
            <div className="gallery-photo">
              <img src={current.src} alt={current.alt} />
              <div className="gallery-caption">
                <h3>{current.title}</h3>
                <p>{current.caption}</p>
              </div>
            </div>
            <div className="gallery-controls">
              <button className="icon-btn" type="button" onClick={prev} aria-label="Imaginea anterioara">‹</button>
              <button className="icon-btn" type="button" onClick={next} aria-label="Imaginea urmatoare">›</button>
            </div>
          </div>
          <div className="gallery-list">
            {items.map((item, i) => (
              <button className={`gallery-thumb${i === index ? ' active' : ''}`} type="button" onClick={() => setIndex(i)} key={item.src}>
                <img src={item.src} alt="" />
                <span><strong>{item.title}</strong><span>{item.caption}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
