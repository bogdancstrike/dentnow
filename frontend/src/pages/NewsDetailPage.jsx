import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { fetchNewsItem, mediaUrl, publicQueryKeys } from '../api/publicClient';
import { usePreviewDraft } from '../api/previewDraft';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { StatusPage } from '../shared/StatusPage';
import NotFound from './NotFound';
import './Noutati.css';
import { useOptionalSiteData } from '../public-site/SiteDataProvider';

export default function NewsDetailPage() {
  const siteName = useOptionalSiteData()?.site?.site_name || '';
  const { slug = '' } = useParams();
  const draft = usePreviewDraft('news');
  const draftMatches = Boolean(
    draft
    && (draft.slug === slug || draft.__preview_slug === slug),
  );
  const query = useQuery({
    queryKey: publicQueryKeys.newsItem(slug),
    queryFn: () => fetchNewsItem(slug),
    enabled: Boolean(slug) && !draftMatches,
    retry: false,
  });
  const newsItem = draftMatches ? draft : query.data;

  if (!draftMatches && query.isLoading) {
    return <div className="news-detail-loading">Se încarcă noutatea…</div>;
  }
  if (query.isError && query.error instanceof ApiError && query.error.status !== 404) {
    return <StatusPage code={503} />;
  }
  if (!newsItem) return <NotFound />;

  const publishedLabel = newsItem.published_at
    ? new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(newsItem.published_at))
    : '';

  return (
    <div>
      <Seo
        title={newsItem.title}
        description={newsItem.summary || ''}
        path={`/noutati/${slug}`}
      />
      <PageHero
        tag={newsItem.category || siteName}
        title={newsItem.title}
        subtitle={newsItem.summary || ''}
      />
      <article className="news-detail">
        {newsItem.media_id ? (
          <img
            className="news-detail-image"
            src={mediaUrl(newsItem.media_id, 'hero')}
            alt={newsItem.title}
          />
        ) : null}
        {publishedLabel ? <p className="news-detail-date">Publicat la {publishedLabel}</p> : null}
        <div
          className="news-detail-body"
          dangerouslySetInnerHTML={{ __html: newsItem.body_html || '' }}
        />
        <div className="news-detail-actions">
          <Link to="/noutati" className="btn btn-outline">Înapoi la noutăți</Link>
        </div>
      </article>
    </div>
  );
}
