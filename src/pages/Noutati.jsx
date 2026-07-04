import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { newsItems } from '../data/content';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import './Noutati.css';

export default function Noutati() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <Seo title="Noutati DentNow" description="Actualizari DentNow despre program, preturi si continut care trebuie aprobat de clinica." path="/noutati" />
      <PageHero tag="Noutati DentNow" title='Actualizari <em class="ac">curente.</em>' subtitle="Continutul vechi din 2024 a fost inlocuit cu intrari de lansare ce trebuie validate de clinica." />
      <div className="news-grid">
        <article className="news-main rv">
          <img className="news-main-img" src="/assets/dentnow/clinic-exterior.svg" alt="Placeholder pentru noutati DentNow" />
          <div className="news-main-body">
            <div className="news-cat">Lansare continut</div>
            <h2 className="news-main-title">Noutatile DentNow sunt pregatite pentru informatii aprobate de clinica.</h2>
            <div className="news-date">Iulie 2026</div>
            <p className="news-text">Foloseste aceasta pagina pentru program, servicii noi, schimbari de preturi sau informatii utile. Evita promotiile fara data clara de valabilitate.</p>
            <Link to="/tratamente" className="btn btn-dark">Vezi tarifele actualizate</Link>
          </div>
        </article>
        <div className="news-side">
          {newsItems.map((n, i) => (
            <Link to={n.link} key={n.title} className={`news-card rv d${i + 1}`}>
              <div className="nc-cat">{n.cat}</div>
              <div className="nc-title">{n.title}</div>
              <div className="nc-date">{n.date}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
