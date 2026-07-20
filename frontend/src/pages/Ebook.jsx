import { useRevealAll } from '../hooks/useReveal';
import { ebooks } from '../data/content';
import { buildWhatsAppLeadUrl } from '../lib/leadCapture';
import PageHero from '../components/ui/PageHero';
import PlaceholderCover from '../components/ui/PlaceholderCover';
import Seo from '../components/seo/Seo';
import './Ebook.css';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { useSiteData } from '../public-site/SiteDataProvider';
import { siteLink } from '../lib/siteContent';

export default function Ebook() {
  const t = useSiteTexts();
  const { links } = useSiteData();
  const leadPhone = siteLink(links, 'phone')?.value || '';
  const ref = useRevealAll([]);

  return (
    <div ref={ref}>
      <Seo title="E-bookuri DentNow" description="Resurse gratuite DentNow pentru igiena orala, implanturi, estetica si preventie." path="/ebook" />
      <PageHero dark tag={t('ebook.hero.tag')} title={t('ebook.hero.title')} subtitle={t('ebook.hero.subtitle')} />

      <div className="ebook-grid">
        {ebooks.map((eb, i) => (
          <article key={eb.title} className={`ebook-card rv${i % 3 > 0 ? ` d${i % 3}` : ''}`}>
            <PlaceholderCover className="ebook-cover" label={eb.title} tag={eb.label} />
            <div className="ebook-body">
              <div className="ebook-cat">{eb.cat}</div>
              <h3 className="ebook-title">{eb.title}</h3>
              <p className="ebook-desc">{eb.desc}</p>
              <a
                className="ebook-dl"
                href={buildWhatsAppLeadUrl({ source: 'ebook', ebook: eb.title }, leadPhone)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cere pe WhatsApp
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
