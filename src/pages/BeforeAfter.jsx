import { useRevealAll } from '../hooks/useReveal';
import { beforeAfterCases } from '../data/content';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { DarkCTA } from '../components/ui/SharedSections';
import './BeforeAfter.css';

export default function BeforeAfter() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <Seo title="Before & After DentNow" description="Exemple vizuale DentNow pregatite pentru fotografii reale cu acordul pacientilor." path="/before-after" />
      <PageHero dark tag="Exemple vizuale DentNow" title='Before & <em class="ac">After.</em>' subtitle="Placeholder-ele de mai jos nu sunt rezultate clinice reale. Inlocuieste-le cu fotografii publicabile doar dupa consimtamant." />
      <div className="case-grid">
        {beforeAfterCases.map((c, i) => (
          <article key={c.title} className={`case-card rv${i % 2 ? ' d1' : ''}`}>
            <div className="case-pair">
              <div className="case-shot"><img src={c.beforeImage} alt={`${c.title} inainte - placeholder`} /><div className="case-label">INAINTE</div></div>
              <div className="case-shot"><img src={c.afterImage} alt={`${c.title} dupa - placeholder`} /><div className="case-label">DUPA</div></div>
            </div>
            <div className="case-body">
              <small>{c.treatment}</small>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          </article>
        ))}
      </div>
      <DarkCTA title="Vrei o evaluare pentru cazul tau?" subtitle="Trimite-ne detalii sau suna clinica pentru o programare." />
    </div>
  );
}
