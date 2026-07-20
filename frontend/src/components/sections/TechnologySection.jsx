import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { mediaUrl } from '../../api/publicClient';

export default function TechnologySection() {
  const t = useSiteTexts();
  const { technologies = [] } = useSiteData();
  if (!technologies.length) return null;

  return (
    <section className="section-wrap alt" id="tehnologii">
      <div className="section-inner">
        <div className="section-kicker">{t('home.tech.tag')}</div>
        <h2 className="section-title">{t('home.tech.title')}</h2>
        <p className="section-lead">{t('home.tech.lead')}</p>
        <div className="technology-grid">
          {technologies.map((tech) => (
            <article className="technology-card" key={tech.name}>
              {tech.media_id && <img src={mediaUrl(tech.media_id, 'hero')} alt={tech.name} />}
              <div>
                <h3>{tech.name}</h3>
                {tech.description && <p>{tech.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
