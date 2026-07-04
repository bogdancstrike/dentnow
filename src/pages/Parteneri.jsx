import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { partners } from '../data/content';
import PageHero from '../components/ui/PageHero';
import './Parteneri.css';

export default function Parteneri() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <PageHero tag="Parteneri DentNow" title='Parteneri de <em class="ac">încredere.</em>' subtitle="Colaborăm cu branduri și furnizori de top din industria stomatologică mondială." />
      <div className="partners-grid">
        {partners.map((p, i) => (
          <div key={i} className={`partner-card rv${i > 0 ? ` d${i % 4}` : ''}`}>
            <span className="p-logo">{p.icon}</span>
            <div className="p-name">{p.name}</div>
            <div className="p-type">{p.type}</div>
            <span className="p-badge">{p.badge}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '0 48px 80px' }}>
        <p style={{ color: 'var(--gray)', fontSize: 15, marginBottom: 24 }}>Ești o companie interesată de un parteneriat cu DentNow?</p>
        <a href={`mailto:${config.email}`} className="btn btn-dark">✉️ contactează-ne pentru parteneriate</a>
      </div>
    </div>
  );
}
