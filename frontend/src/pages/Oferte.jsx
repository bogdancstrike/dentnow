import { useRevealAll } from '../hooks/useReveal';
import { useQuery } from '@tanstack/react-query';
import { fetchOffers, publicQueryKeys } from '../api/publicClient';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import ContactCTA from '../components/sections/ContactCTA';
import './Oferte.css';
import { usePreviewDraft } from '../api/previewDraft';
import { StatusPage } from '../shared/StatusPage';
import { useSiteTexts } from '../hooks/useSiteTexts';

export default function Oferte() {
  const t = useSiteTexts();
  const { data: offers = [], isLoading, isError } = useQuery({
    queryKey: publicQueryKeys.offers,
    queryFn: fetchOffers,
  });
  const offerDraft = usePreviewDraft('offer');
  const previewOffers = offerDraft
    ? (() => {
        const index = offers.findIndex((offer) =>
          (offerDraft.id && offer.id === offerDraft.id)
          || offer.slug === offerDraft.__preview_slug
          || offer.slug === offerDraft.slug,
        );
        if (index < 0) return [...offers, offerDraft];
        return offers.map((offer, itemIndex) => itemIndex === index ? { ...offer, ...offerDraft } : offer);
      })()
    : offers;
  const ref = useRevealAll([previewOffers]);

  if (isError) return <StatusPage code={503} />;

  return (
    <div ref={ref}>
      <Seo path="/oferte" />
      <PageHero dark tag={t('oferte.hero.tag')} title={t('oferte.hero.title')} subtitle={t('oferte.hero.subtitle')} />
      <div className="offers-grid">
        {isLoading && <div style={{ color: 'white', padding: '2rem' }}>Se incarcă ofertele...</div>}
        {previewOffers.map((o, i) => {
          const saveAmount = (o.old_amount && o.price_amount) ? o.old_amount - o.price_amount : null;
          return (
            <article
              key={o.slug}
              className={`offer-card rv${i > 0 ? ` d${i % 3}` : ''}${o.featured ? ' featured' : ''}`}
              data-analytics-type="offer"
              data-analytics-key={o.slug}
            >
              <div className="offer-badge">{o.badge || 'Promo'}</div>
              <span className="offer-icon">⭐</span>
              <h3 className="offer-name">{o.name}</h3>
              <p className="offer-desc">{o.summary}</p>
              <div className="price-row">
                <span className="price-new">{o.price_amount ? `${o.price_amount} ${o.currency}` : 'La cerere'}</span>
                {o.old_amount && <span className="price-old">{o.old_amount} {o.currency}</span>}
              </div>
              {saveAmount && <span className="price-save">Economisesti {saveAmount} {o.currency}</span>}
              <div className="offer-features">
                {o.features && o.features.map((f) => <div key={f} className="of">{f}</div>)}
              </div>
              {(o.treatments?.length > 0 || o.clinics?.length > 0) && (
                <div className="offer-relations" aria-label="Disponibilitatea ofertei">
                  {o.treatments?.length > 0 && (
                    <div>
                      <span className="offer-relations-label">Tratamente</span>
                      <div className="offer-relation-links">
                        {o.treatments.map((treatment) => (
                          <a key={treatment.slug} href="/tratamente">{treatment.name}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {o.clinics?.length > 0 && (
                    <div>
                      <span className="offer-relations-label">Clinici participante</span>
                      <div className="offer-relation-links">
                        {o.clinics.map((clinic) => (
                          <a key={clinic.slug} href={`/locatii/${clinic.slug}`}>{clinic.name}</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <a
                href="#oferta-programare"
                className="btn btn-dark offer-action"
                data-analytics-cta="contact"
                data-analytics-label={`oferta:${o.slug}`}
              >Cere programare</a>
            </article>
          );
        })}
      </div>
      <section id="oferta-programare" className="offer-appointment">
        <ContactCTA title={t('oferte.cta.title')} subtitle={t('oferte.cta.subtitle')} source="oferte" />
        {t('oferte.note') && <p className="offer-note">{t('oferte.note')}</p>}
      </section>
    </div>
  );
}
