import { useQuery } from '@tanstack/react-query';
import { fetchTreatments, publicQueryKeys } from '../api/publicClient';
import { useLocation, Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { useSiteData } from '../public-site/SiteDataProvider';
import { clinicWhatsappHref } from '../lib/clinicContact';
import { IconPhone, IconClock, IconAlert } from '../components/ui/Icons';
import './TreatmentDetail.css';
import { isPreviewMode, usePreviewDraft } from '../api/previewDraft';
import NotFound from './NotFound';
import { StatusPage } from '../shared/StatusPage';


export default function TreatmentDetail() {
  const { pathname } = useLocation();
  const treatSlug = pathname.replace(/\/+$/, '').split('/').pop();
  const openPicker = useClinicPicker();
  const { clinics } = useSiteData();
  const treatmentDraft = usePreviewDraft('treatment');

  const { data: treatments = [], isLoading, isError } = useQuery({
    queryKey: publicQueryKeys.treatments,
    queryFn: fetchTreatments,
  });

  const savedItem = treatments.find(t => t.slug === treatSlug)
    || (treatmentDraft?.id ? treatments.find((t) => t.id === treatmentDraft.id) : null);
  const backendItem = treatmentDraft ? { ...(savedItem || {}), ...treatmentDraft } : savedItem;

  if (isLoading) {
    return <div style={{ padding: '8rem 2rem', textAlign: 'center', color: 'white' }}>Se încarcă tratamentul...</div>;
  }
  if (isError) return <StatusPage code={503} />;

  if (!backendItem) {
    return isPreviewMode() ? null : <NotFound />;
  }

  const primaryPrice = backendItem.prices?.[0];
  const formatMoney = (amount, currency = 'RON') => (
    new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  );
  const formatPrice = (price) => {
    if (!price || price.price_kind === 'on_request' || price.amount == null) return 'La cerere';
    if (price.price_kind === 'range' && price.amount_max != null) {
      return `${formatMoney(price.amount, price.currency)} – ${formatMoney(price.amount_max, price.currency)}`;
    }
    const value = formatMoney(price.amount, price.currency);
    return price.price_kind === 'from' ? `de la ${value}` : value;
  };

  const item = {
    title: backendItem.name,
    description: backendItem.summary || backendItem.name,
    tag: backendItem.category_label || 'Tratament',
    heroTitle: backendItem.name,
    heroSubtitle: backendItem.summary || '',
    price: formatPrice(primaryPrice),
    oldPrice: primaryPrice?.old_amount != null ? formatMoney(primaryPrice.old_amount, primaryPrice.currency) : null,
    detailsHtml: backendItem.detail_html || '',
    benefits: [],
    faqs: []
  };

  const jsonLd = [
    {
      '@type': 'MedicalProcedure',
      name: item.title,
      description: item.description,
      procedureType: item.tag,
      offers: {
        '@type': 'Offer',
        price: item.price.replace(/[^0-9]/g, '') || '1490',
        priceCurrency: 'RON',
        availability: 'https://schema.org/InStock'
      }
    },
    {
      '@type': 'FAQPage',
      mainEntity: item.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
  ];

  const treatmentWhatsappHref = clinicWhatsappHref(clinics[0], `Buna ziua, doresc detalii despre ${item.title}`);
  const hasEditorialContent = Boolean(item.heroSubtitle || item.detailsHtml || item.benefits.length || item.faqs.length);

  return (
    <div className="treatment-detail-page">
      <Seo title={item.title} description={item.description} path={`/tratamente/${treatSlug}`} jsonLd={jsonLd} />

      <header className="treatment-detail-hero">
        <div className="treatment-detail-hero-inner">
          <div className="treatment-detail-heading">
            <Link className="treatment-breadcrumb" to="/tratamente">Tratamente <span aria-hidden>›</span> {item.tag}</Link>
            <span className="treatment-category">{item.tag}</span>
            <h1>{item.heroTitle}</h1>
            {item.heroSubtitle && <p>{item.heroSubtitle}</p>}
          </div>

          <aside className="treatment-booking-card" aria-label="Preț și programare">
            <span className="price-label">Preț orientativ</span>
            <div className="price-value-row">
              <strong className="current-price">{item.price}</strong>
              {item.oldPrice && <span className="old-price">{item.oldPrice}</span>}
            </div>
            {primaryPrice?.note && <span className="treatment-price-note">{primaryPrice.note}</span>}
            <p>Prețul final se confirmă prin deviz, după evaluarea medicului.</p>
            <div className="sidebar-cta-group">
              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> Programează o consultație
              </button>
              {treatmentWhatsappHref && (
                <a href={treatmentWhatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline full-width">
                  Întreabă pe WhatsApp
                </a>
              )}
            </div>
            <div className="sidebar-info-list">
              <div><IconClock size={16} /> Evaluare și plan de tratament</div>
              <div><IconAlert size={16} /> Opțiunile se explică înainte de intervenție</div>
            </div>
          </aside>
        </div>
      </header>

      <main className={`treatment-detail-sec${hasEditorialContent ? '' : ' is-compact'}`}>
        {hasEditorialContent ? (
          <article className="treatment-main-content">
            {item.heroSubtitle && (
              <div className="treatment-summary">
                <span>Pe scurt</span>
                <p>{item.heroSubtitle}</p>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: item.detailsHtml }} />

            {item.benefits && item.benefits.length > 0 && (
              <>
                <h3>Beneficii Cheie la DentNow:</h3>
                <ul className="benefits-list">
                  {item.benefits.map((b) => (
                    <li key={b}>✓ {b}</li>
                  ))}
                </ul>
              </>
            )}

            {/* FAQs */}
            {item.faqs && item.faqs.length > 0 && (
              <div className="treatment-faqs">
                <h3>Întrebări Frecvente</h3>
                {item.faqs.map((f) => (
                  <div key={f.q} className="faq-card">
                    <h4>{f.q}</h4>
                    <p>{f.a}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ) : (
          <section className="treatment-next-step" aria-labelledby="treatment-next-step-title">
            <span className="treatment-next-step-index">01</span>
            <div>
              <h2 id="treatment-next-step-title">Primul pas este evaluarea.</h2>
              <p>Medicul confirmă indicația, etapele și costul final înainte de tratament.</p>
            </div>
          </section>
        )}

        <div className="treatment-bottom-bar">
          <Link to="/tratamente" className="btn btn-outline">← Înapoi la toate tratamentele</Link>
        </div>
      </main>
    </div>
  );
}
