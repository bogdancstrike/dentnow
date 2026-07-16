import { patientJourney } from '../../data/clinicProof';
import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';

export default function PatientJourney() {
  const t = useSiteTexts();
  return (
    <section className="section-wrap">
      <div className="section-inner">
        <div className="section-kicker">{t('home.journey.tag')}</div>
        <h2 className="section-title">{t('home.journey.title')}</h2>
        <div className="journey-grid">
          {patientJourney.map((item) => (
            <article className="journey-card" key={item.step}>
              <div className="journey-step">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
