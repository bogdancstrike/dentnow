import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { useSiteData } from '../public-site/SiteDataProvider';
import { mediaUrl } from '../api/publicClient';
import './Parteneri.css';

export default function Parteneri() {
  const { partners } = useSiteData();
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <Seo title="Parteneri si tehnologii DentNow" description="Parteneri, furnizori si tehnologii folosite sau mentionate de DentNow." path="/parteneri" />
      <PageHero tag="Parteneri DentNow" title='Parteneri si <em class="ac">tehnologii.</em>' subtitle="Logourile oficiale se folosesc doar daca exista drept de utilizare. Pana atunci afisam etichete text." />
      <div className="partners-grid">
        {partners.map((p, i) => {
          const name = p.name || 'Partener nou';
          const initials = name.split(/\s+/).map((word) => word[0]).join('').slice(0, 4);
          return (
            <article key={`${name}-${i}`} className={`partner-card rv${i > 0 ? ` d${i % 4}` : ''}`}>
              <span className="p-logo">
                {p.logo_media_id
                  ? <img src={mediaUrl(p.logo_media_id, 'thumbnail')} alt={`Logo ${name}`} />
                  : initials}
              </span>
              <div className="p-name">{name}</div>
              {p.relationship_type && <div className="p-type">{p.relationship_type}</div>}
              {p.badge && <span className="p-badge">{p.badge}</span>}
              {p.rights_note && <p className="p-rights">{p.rights_note}</p>}
              {p.link_url && (
                <a className="p-link" href={p.link_url} target="_blank" rel="noopener noreferrer">
                  Website partener <span aria-hidden>↗</span>
                </a>
              )}
            </article>
          );
        })}
      </div>
      <div className="partners-contact">
        <p>Esti o companie interesata de un parteneriat cu DentNow?</p>
        <a href={`mailto:${config.email}`} className="btn btn-dark">Contacteaza-ne pentru parteneriate</a>
      </div>
    </div>
  );
}
