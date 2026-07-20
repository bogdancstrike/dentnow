import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useQuery } from '@tanstack/react-query';
import { fetchNews, mediaUrl, publicQueryKeys } from '../api/publicClient';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import './Noutati.css';
import { usePreviewDraft } from '../api/previewDraft';
import { StatusPage } from '../shared/StatusPage';
import { useSiteTexts } from '../hooks/useSiteTexts';

export default function Noutati() {
  const t = useSiteTexts();
  const { data: newsItems = [], isError } = useQuery({
    queryKey: publicQueryKeys.news,
    queryFn: fetchNews,
  });
  const newsDraft = usePreviewDraft('news');
  const previewItems = newsDraft
    ? (() => {
        const index = newsItems.findIndex((item) =>
          (newsDraft.id && item.id === newsDraft.id)
          || item.slug === newsDraft.__preview_slug
          || item.slug === newsDraft.slug,
        );
        if (index < 0) return [newsDraft, ...newsItems];
        return newsItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...newsDraft } : item);
      })()
    : newsItems;

  const ref = useRevealAll([previewItems]);

  const mainNews = previewItems[0];
  const sideNews = previewItems.slice(1);

  if (isError) return <StatusPage code={503} />;

  return (
    <div ref={ref}>
      <Seo path="/noutati" />
      <PageHero tag={t('noutati.hero.tag')} title={t('noutati.hero.title')} subtitle={t('noutati.hero.subtitle')} />
      <div className="news-grid">
        {mainNews ? (
          <article className="news-main rv">
            {mainNews.media_id && <img className="news-main-img" src={mediaUrl(mainNews.media_id, 'hero')} alt={mainNews.title} />}
            <div className="news-main-body">
              <div className="news-cat">{mainNews.category || 'Noutate'}</div>
              <h2 className="news-main-title">{mainNews.title}</h2>
              <div className="news-date">{mainNews.published_at ? new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(mainNews.published_at)) : ''}</div>
              <p className="news-text">{mainNews.summary}</p>
              <Link to={`/noutati/${mainNews.slug}`} className="btn btn-dark">Citește mai mult</Link>
            </div>
          </article>
        ) : (
          <p className="news-empty">Nu există noutăți publicate.</p>
        )}
        <div className="news-side">
          {sideNews.map((n, i) => (
            <Link to={`/noutati/${n.slug}`} key={n.slug} className={`news-card rv d${i + 1}`}>
              <div className="nc-cat">{n.category || 'Noutate'}</div>
              <div className="nc-title">{n.title}</div>
              <div className="nc-date">{n.published_at ? new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(n.published_at)) : ''}</div>
              <span className="news-read-more">Citește mai mult</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
