import { Link, useParams } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { articles } from '../data/articles';
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
  const article = slug ? articles.find((item) => slugify(item.title) === slug) : null;

  if (slug) {
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
        <PageHero tag={article.cat} title={article.title} subtitle={article.excerpt} />
        <article className="article-detail">
          <PlaceholderCover className="article-detail-img" label={article.title} tag={article.cat} />
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }} />
          <div className="article-actions">
            <a href={`tel:${config.phone}`} className="btn btn-dark">Programare: {config.phoneDisplay}</a>
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
        {articles.map((a, i) => (
          <Link key={a.title} to={`/articole/${slugify(a.title)}`} className={`art-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
            <PlaceholderCover className="art-thumb" label={a.title} tag={a.cat} />
            <div className="art-body">
              <div className="art-cat">{a.cat}</div>
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
