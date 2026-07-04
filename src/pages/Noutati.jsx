import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { newsItems } from '../data/content';
import PageHero from '../components/ui/PageHero';
import './Noutati.css';

export default function Noutati() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <PageHero tag="Noutăți DentNow" title='Rămâi <em class="ac">la curent.</em>' subtitle="Noutăți din clinică, oferte noi, tehnologii și știri." />
      <div className="news-grid">
        <div className="news-main rv">
          <div className="news-main-img">🦷</div>
          <div className="news-main-body">
            <div className="news-cat">Tehnologie Nouă</div>
            <h2 className="news-main-title">DentNow introduce Guided Biofilm Therapy — revoluția în igienizare</h2>
            <div className="news-date">📅 Noiembrie 2024</div>
            <p className="news-text">Am achiziționat cel mai performant sistem EMS AIRFLOW® pentru Guided Biofilm Therapy. Ședința durează 45-60 minute. Preț special: 320 lei (față de 400 lei).</p>
            <a href={`tel:${config.phone}`} className="btn btn-dark" style={{ marginTop: 24 }}>📞 {config.phoneDisplay}</a>
          </div>
        </div>
        <div className="news-side">
          {newsItems.map((n, i) => (
            <div key={i} className={`news-card rv d${i + 1}`}>
              <div className="nc-cat">{n.cat}</div>
              <div className="nc-title">{n.title}</div>
              <div className="nc-date">📅 {n.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
