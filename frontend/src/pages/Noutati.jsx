import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useQuery } from '@tanstack/react-query';
import { fetchNews, publicQueryKeys } from '../api/publicClient';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import './Noutati.css';

export default function Noutati() {
  const { data: newsItems = [] } = useQuery({
    queryKey: publicQueryKeys.news,
    queryFn: fetchNews,
  });

  const ref = useRevealAll([newsItems]);

  const mainNews = newsItems[0];
  const sideNews = newsItems.slice(1);

  return (
    <div ref={ref}>
      <Seo title="Noutati DentNow" description="Actualizari DentNow despre program, preturi si continut care trebuie aprobat de clinica." path="/noutati" />
      <PageHero tag="Noutati DentNow" title='Actualizari <em class="ac">curente.</em>' subtitle="Continutul vechi din 2024 a fost inlocuit cu intrari de lansare ce trebuie validate de clinica." />
      <div className="news-grid">
        {mainNews ? (
          <article className="news-main rv">
            <img className="news-main-img" src={mainNews.media_id ? `/media/${mainNews.media_id}` : "/assets/dentnow/clinic-exterior.svg"} alt={mainNews.title} />
            <div className="news-main-body">
              <div className="news-cat">{mainNews.category || 'Noutate'}</div>
              <h2 className="news-main-title">{mainNews.title}</h2>
              <div className="news-date">{mainNews.published_at ? new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(mainNews.published_at)) : ''}</div>
              <p className="news-text">{mainNews.summary}</p>
              <Link to={`/noutati/${mainNews.slug}`} className="btn btn-dark">Citește mai mult</Link>
            </div>
          </article>
        ) : (
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
        )}
        <div className="news-side">
          {sideNews.map((n, i) => (
            <Link to={`/noutati/${n.slug}`} key={n.slug} className={`news-card rv d${i + 1}`}>
              <div className="nc-cat">{n.category || 'Noutate'}</div>
              <div className="nc-title">{n.title}</div>
              <div className="nc-date">{n.published_at ? new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(n.published_at)) : ''}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
