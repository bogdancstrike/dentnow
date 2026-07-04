import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { partners } from '../data/content';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import './Parteneri.css';

export default function Parteneri() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <Seo title="Parteneri si tehnologii DentNow" description="Parteneri, furnizori si tehnologii folosite sau mentionate de DentNow." path="/parteneri" />
      <PageHero tag="Parteneri DentNow" title='Parteneri si <em class="ac">tehnologii.</em>' subtitle="Logourile oficiale se folosesc doar daca exista drept de utilizare. Pana atunci afisam etichete text." />
      <div className="partners-grid">
        {partners.map((p, i) => (
          <article key={p.name} className={`partner-card rv${i > 0 ? ` d${i % 4}` : ''}`}>
            <span className="p-logo">{p.icon}</span>
            <div className="p-name">{p.name}</div>
            <div className="p-type">{p.type}</div>
            <span className="p-badge">{p.badge}</span>
          </article>
        ))}
      </div>
      <div className="partners-contact">
        <p>Esti o companie interesata de un parteneriat cu DentNow?</p>
        <a href={`mailto:${config.email}`} className="btn btn-dark">Contacteaza-ne pentru parteneriate</a>
      </div>
    </div>
  );
}
