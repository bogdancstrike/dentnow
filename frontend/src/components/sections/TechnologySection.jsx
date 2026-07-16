import { technologies } from '../../data/clinicProof';
import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';

export default function TechnologySection() {
  const t = useSiteTexts();
  return (
    <section className="section-wrap alt">
      <div className="section-inner">
        <div className="section-kicker">{t('home.tech.tag')}</div>
        <h2 className="section-title">{t('home.tech.title')}</h2>
        <p className="section-lead">{t('home.tech.lead')}</p>
        <div className="technology-grid">
          {technologies.map((tech) => (
            <article className="technology-card" key={tech.title}>
              <img src={tech.image} alt={`Placeholder ${tech.title}`} />
              <div>
                <h3>{tech.title}</h3>
                <p>{tech.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
