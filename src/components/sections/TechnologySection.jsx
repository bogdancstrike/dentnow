import { technologies } from '../../data/clinicProof';
import './Sections.css';

export default function TechnologySection() {
  return (
    <section className="section-wrap alt">
      <div className="section-inner">
        <div className="section-kicker">Tehnologie si siguranta</div>
        <h2 className="section-title">Explicam pacientului cu ce lucram si de ce conteaza.</h2>
        <p className="section-lead">Tehnologia trebuie prezentata ca beneficiu clinic concret: confort, precizie, diagnostic si siguranta.</p>
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
