import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { offers } from '../data/content';
import PageHero from '../components/ui/PageHero';
import { IconPhone } from '../components/ui/Icons';
import './Oferte.css';

export default function Oferte() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <PageHero dark tag="Oferte Speciale DentNow" title='Tratamente premium,<br><em class="ac">prețuri accesibile.</em>' subtitle="Oferte limitate — profită acum!" />
      <div className="offers-grid">
        {offers.map((o, i) => (
          <div key={i} className={`offer-card rv${i > 0 ? ` d${i % 3}` : ''}${o.featured ? ' featured' : ''}`}>
            <div className="offer-badge">{o.badge}</div>
            <span className="offer-icon">{o.icon}</span>
            <h3 className="offer-name">{o.name}</h3>
            <p className="offer-desc">{o.desc}</p>
            <div className="price-row"><span className="price-new">{o.price}</span><span className="price-old">{o.oldPrice}</span></div>
            <span className="price-save">Economisești {o.save}</span>
            <div className="offer-features">{o.features.map((f, j) => <div key={j} className="of">{f}</div>)}</div>
            <a href={`tel:${config.phone}`} className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }}>
              <IconPhone size={14} color="#fff" /> {config.phoneDisplay}
            </a>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--dark)', padding: '80px 48px', textAlign: 'center' }} data-nav-dark>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, marginBottom: 28 }}>* Ofertele sunt valabile în limita locurilor disponibile.</p>
        <a href={`tel:${config.phone}`} className="btn btn-white btn-lg"><IconPhone size={18} /> Sună: {config.phoneDisplay}</a>
      </div>
    </div>
  );
}
