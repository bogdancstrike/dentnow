import { useRevealAll } from '../hooks/useReveal';
import { ebooks } from '../data/content';
import { buildWhatsAppLeadUrl } from '../lib/leadCapture';
import PageHero from '../components/ui/PageHero';
import PlaceholderCover from '../components/ui/PlaceholderCover';
import Seo from '../components/seo/Seo';
import './Ebook.css';

export default function Ebook() {
  const ref = useRevealAll([]);

  return (
    <div ref={ref}>
      <Seo title="E-bookuri DentNow" description="Resurse gratuite DentNow pentru igiena orala, implanturi, estetica si preventie." path="/ebook" />
      <PageHero dark tag="Resurse gratuite" title='E-bookuri <em class="ac">DentNow.</em>' subtitle="Cere ghidul dorit pe WhatsApp si ti-l trimitem direct. Fara formular online." />

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
                href={buildWhatsAppLeadUrl({ source: 'ebook', ebook: eb.title })}
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
