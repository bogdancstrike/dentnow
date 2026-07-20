import { useRevealAll } from '../hooks/useReveal';
import { buildWhatsAppLeadUrl } from '../lib/leadCapture';
import PageHero from '../components/ui/PageHero';
import PlaceholderCover from '../components/ui/PlaceholderCover';
import Seo from '../components/seo/Seo';
import './Ebook.css';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { useSiteData } from '../public-site/SiteDataProvider';
import { siteLink } from '../lib/siteContent';
import { mediaUrl } from '../api/publicClient';

export default function Ebook() {
  const t = useSiteTexts();
  const { links, ebooks } = useSiteData();
  const leadPhone = siteLink(links, 'phone')?.value || '';
  const ref = useRevealAll([]);

  return (
    <div ref={ref}>
      <Seo title="E-bookuri DentNow" description="Resurse gratuite DentNow pentru igiena orala, implanturi, estetica si preventie." path="/ebook" />
      <PageHero dark tag={t('ebook.hero.tag')} title={t('ebook.hero.title')} subtitle={t('ebook.hero.subtitle')} />

      <div className="ebook-grid">
        {ebooks.map((eb, i) => {
          const downloadHref = eb.download_media_id
            ? mediaUrl(eb.download_media_id, 'original')
            : buildWhatsAppLeadUrl({ source: 'ebook', ebook: eb.title }, leadPhone);
          return (
            <article key={eb.slug} className={`ebook-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
              {eb.cover_media_id
                ? <div className="ebook-cover"><img src={mediaUrl(eb.cover_media_id, 'hero')} alt={`Copertă ${eb.title}`} /></div>
                : <PlaceholderCover className="ebook-cover" label={eb.title} tag={eb.category} />}
              <div className="ebook-body">
                {eb.category && <div className="ebook-cat">{eb.category}</div>}
                <h3 className="ebook-title">{eb.title}</h3>
                {eb.description && <p className="ebook-desc">{eb.description}</p>}
                {downloadHref && <a
                  className="ebook-dl"
                  href={downloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {eb.download_media_id ? 'Descarcă' : 'Cere pe WhatsApp'}
                </a>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
