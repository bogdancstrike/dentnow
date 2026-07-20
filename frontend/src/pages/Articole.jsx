import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { fetchArticles, fetchArticle, publicQueryKeys } from '../api/publicClient';
import PageHero from '../components/ui/PageHero';
import PlaceholderCover from '../components/ui/PlaceholderCover';
import Seo from '../components/seo/Seo';
import './Articole.css';
import { ApiError } from '../api/http';
import NotFound from './NotFound';
import { StatusPage } from '../shared/StatusPage';
import { useSiteTexts } from '../hooks/useSiteTexts';

export default function Articole() {
  const t = useSiteTexts();
  const { slug } = useParams();
  const openPicker = useClinicPicker();

  const { data: articles = [], isLoading: loadingList, isError: listFailed } = useQuery({
    queryKey: publicQueryKeys.articles,
    queryFn: fetchArticles,
    enabled: !slug,
  });

  const { data: article, isLoading: loadingDetail, isError: detailFailed, error: detailError } = useQuery({
    queryKey: publicQueryKeys.article(slug || ''),
    queryFn: () => fetchArticle(slug || ''),
    enabled: !!slug,
    retry: false,
  });

  const ref = useRevealAll([slug, articles, article]);

  if (slug) {
    if (loadingDetail) return <div ref={ref} style={{ padding: '8rem 2rem', textAlign: 'center' }}>Incarcare...</div>;
    if (detailFailed && detailError instanceof ApiError && detailError.status !== 404) return <StatusPage code={503} />;
    if (!article) return <NotFound />;
    return (
      <div ref={ref}>
        <Seo title={article.title} description={article.excerpt} path={`/articole/${slug}`} />
        <PageHero tag={article.category} title={article.title} subtitle={article.excerpt} />
        <article className="article-detail">
          <PlaceholderCover className="article-detail-img" label={article.title} tag={article.category} />
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body_html || '' }} />
          <div className="article-actions">
            <button type="button" onClick={() => openPicker('call')} className="btn btn-dark">Programare telefonica</button>
            <Link to="/articole" className="btn btn-outline">Inapoi la articole</Link>
          </div>
        </article>
      </div>
    );
  }

  if (listFailed) return <StatusPage code={503} />;

  return (
    <div ref={ref}>
      <Seo path="/articole" />
      <PageHero tag={t('articole.hero.tag')} title={t('articole.hero.title')} subtitle={t('articole.hero.subtitle')} />
      <div className="articles-grid">
        {loadingList ? <div style={{ padding: '2rem', textAlign: 'center' }}>Incarcare...</div> : null}
        {articles.map((a, i) => (
          <Link key={a.slug} to={`/articole/${a.slug}`} className={`art-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
            <PlaceholderCover className="art-thumb" label={a.title} tag={a.category} />
            <div className="art-body">
              <div className="art-cat">{a.category || 'Articol'}</div>
              <h3 className="art-title">{a.title}</h3>
              <p className="art-excerpt">{a.excerpt}</p>
              <span className="art-read">Citeste articolul</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
