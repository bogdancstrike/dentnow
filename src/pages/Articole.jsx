import { useState } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { articles } from '../data/articles';
import PageHero from '../components/ui/PageHero';
import './Articole.css';

export default function Articole() {
  const ref = useRevealAll([]);
  const [modal, setModal] = useState(null);

  return (
    <div ref={ref}>
      <PageHero tag="Articole Utile" title='Informează-te,<br><em class="ac">îngrijește-te.</em>' subtitle="Ghiduri practice și sfaturi de la medicii DentNow." />
      <div className="articles-grid">
        {articles.map((a, i) => (
          <div key={i} className={`art-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`} onClick={() => setModal(a)}>
            <div className={`art-thumb mock-img ${a.bg}`}>{a.icon}</div>
            <div className="art-body">
              <div className="art-cat">{a.cat}</div>
              <h3 className="art-title">{a.title}</h3>
              <p className="art-excerpt">{a.excerpt}</p>
              <span className="art-read">Citește articolul →</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>{modal.cat}</div>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 28, fontWeight: 700, lineHeight: 1.25, marginBottom: 24 }}>{modal.title}</h2>
            <div style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.85, color: 'var(--gray)' }} dangerouslySetInnerHTML={{ __html: modal.body }} />
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid var(--light)' }}>
              <a href={`tel:${config.phone}`} className="btn btn-dark">📞 Programare: {config.phoneDisplay}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
