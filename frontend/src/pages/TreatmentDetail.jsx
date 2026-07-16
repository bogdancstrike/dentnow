import { useQuery } from '@tanstack/react-query';
import { fetchTreatments, publicQueryKeys } from '../api/publicClient';
import { useLocation, Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
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

  const item = {
    title: backendItem.name,
    description: backendItem.summary || backendItem.name,
    tag: backendItem.category_label || 'Tratament',
    heroTitle: backendItem.name,
    heroSubtitle: backendItem.summary || 'Detalii tratament și opțiuni',
    aiOverview: backendItem.summary || '',
    price: primaryPrice?.amount ? `${primaryPrice.amount} ${primaryPrice.currency}` : 'La cerere',
    oldPrice: primaryPrice?.old_amount ? `${primaryPrice.old_amount} ${primaryPrice.currency}` : null,
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

  return (
    <div>
      <Seo title={item.title} description={item.description} path={`/${item.slug}`} jsonLd={jsonLd} />

      <PageHero tag={item.tag} title={item.heroTitle} subtitle={item.heroSubtitle} />

      <section className="treatment-detail-sec">
        {/* Item 4: AI Overview Summary Box for SGE / Snippets */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">✨ Medic Stomatolog</span>
            <span className="sge-ai-tag">Rezumat Medical Instant</span>
          </div>
          <p className="sge-ai-text">{item.aiOverview}</p>
        </div>

        <div className="treatment-detail-grid">
          {/* Main Content Column */}
          <div className="treatment-main-content">
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
          </div>

          {/* Pricing & Booking Card */}
          <div className="treatment-sidebar-card">
            <div className="price-tag-box">
              <span className="price-label">Preț Promoțional DentNow</span>
              <div className="price-value-row">
                <span className="current-price">{item.price}</span>
                {item.oldPrice && <span className="old-price">{item.oldPrice}</span>}
              </div>
              <span className="rate-hint">Plată în rate fixe prin Card Cumpărături</span>
            </div>

            <div className="sidebar-cta-group">
              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> Programează o Consultație
              </button>
              {treatmentWhatsappHref && (
                <a href={treatmentWhatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline full-width">
                  Întreabă un Medic pe WhatsApp
                </a>
              )}
            </div>

            <div className="sidebar-info-list">
              <div><IconClock size={16} color="var(--accent)" /> Consultație inițială cu plan de tratament</div>
              <div><IconAlert size={16} color="var(--accent)" /> Rate fixe fără dobândă</div>
            </div>
          </div>
        </div>

        <div className="treatment-bottom-bar">
          <Link to="/tratamente" className="btn btn-outline">← Înapoi la toate tratamentele</Link>
        </div>
      </section>
    </div>
  );
}
