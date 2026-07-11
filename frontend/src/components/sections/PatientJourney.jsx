import { patientJourney } from '../../data/clinicProof';
import './Sections.css';

export default function PatientJourney() {
  return (
    <section className="section-wrap">
      <div className="section-inner">
        <div className="section-kicker">Cum decurge vizita</div>
        <h2 className="section-title">Un traseu simplu, de la programare la aftercare.</h2>
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
