import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { beforeAfterCases } from '../data/content';
import PageHero from '../components/ui/PageHero';
import { DarkCTA } from '../components/ui/SharedSections';
import './BeforeAfter.css';

export default function BeforeAfter() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <PageHero dark tag="Cazuri Reale DentNow" title='Before & <em class="ac">After.</em>' subtitle="Rezultate reale ale pacienților noștri." />
      <div className="ba-grid">
        {beforeAfterCases.map((c, i) => (
          <div key={i} className={`ba-card rv${i % 2 ? ' d1' : ''}`}>
            <div className="ba-images">
              <div className="ba-img before-bg"><span>{c.beforeEmoji}</span><div className="ba-label">ÎNAINTE</div></div>
              <div className="ba-img after-bg"><span>{c.afterEmoji}</span><div className="ba-label">DUPĂ</div></div>
            </div>
            <div className="ba-info">
              <div className="ba-treatment">{c.treatment}</div>
              <h3 className="ba-title">{c.title}</h3>
              <p className="ba-desc">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <DarkCTA title="Vrei un rezultat similar?" subtitle="Consultația inițială este gratuită. Spune-ne ce îți dorești." />
    </div>
  );
}
