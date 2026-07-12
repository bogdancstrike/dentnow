import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { fetchArticles, fetchArticle, publicQueryKeys } from '../api/publicClient';
import PageHero from '../components/ui/PageHero';
import PlaceholderCover from '../components/ui/PlaceholderCover';
import Seo from '../components/seo/Seo';
import './Articole.css';

function slugify(value) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Articole() {
  const { slug } = useParams();
  const ref = useRevealAll([slug]);
  const openPicker = useClinicPicker();

  const { data: articles = [], isLoading: loadingList } = useQuery({
    queryKey: publicQueryKeys.articles,
    queryFn: fetchArticles,
    enabled: !slug,
  });

  const { data: article, isLoading: loadingDetail } = useQuery({
    queryKey: publicQueryKeys.article(slug || ''),
    queryFn: () => fetchArticle(slug || ''),
    enabled: !!slug,
    retry: false,
  });

  if (slug) {
    if (loadingDetail) return <div ref={ref} style={{ padding: '8rem 2rem', textAlign: 'center' }}>Incarcare...</div>;
    if (!article) {
      return (
        <div ref={ref}>
          <Seo title="Articol negasit" description="Articolul cautat nu exista." path={`/articole/${slug}`} />
          <PageHero tag="Articole" title="Articol negasit" subtitle="Revino la lista de articole DentNow." />
          <div className="article-detail"><Link to="/articole" className="btn btn-dark">Toate articolele</Link></div>
        </div>
      );
    }
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

  return (
    <div ref={ref}>
      <Seo title="Articole stomatologice DentNow" description="Ghiduri practice DentNow despre preventie, implanturi, copii, urgente si estetica dentara." path="/articole" />
      <PageHero tag="Articole utile" title='Informeaza-te,<br><em class="ac">ingrijeste-te.</em>' subtitle="Ghiduri practice si sfaturi pentru pacienti." />
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
