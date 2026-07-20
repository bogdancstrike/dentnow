import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { IconPhone, IconClock, IconAlert, IconWhatsApp, IconMapPin } from '../components/ui/Icons';
import { useSiteData } from '../public-site/SiteDataProvider';
import { clinicPhone } from '../lib/clinicContact';
import './DecontatCas.css';

function BenefitItem({ text }) {
  const separator = text.indexOf(': ');
  if (separator < 0) return <li>{text}</li>;
  return (
    <li>
      <strong>{text.slice(0, separator)}:</strong> {text.slice(separator + 2)}
    </li>
  );
}

export default function DecontatCas() {
  const openPicker = useClinicPicker();
  const t = useSiteTexts();
  const { decontat_cas: cas, clinics, site } = useSiteData();
  const steps = (cas?.steps || []).map((s) => ({ title: s.title, text: s.text || '' }));
  const faqs = cas?.faqs || [];
  const clinicCount = clinics.length;
  const clinicNames = clinics.map((clinic) => clinic.area || clinic.name).join(' · ');

  const jsonLd = [
    {
      '@type': 'MedicalProcedure',
      name: `${t('cas.hero.title')} — ${site.site_name}`,
      description: t('cas.hero.subtitle'),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
  ];

  return (
    <div>
      <Seo path="/decontat-cas" jsonLd={jsonLd} />

      <PageHero
        tag={t('cas.hero.tag')}
        title={t('cas.hero.title')}
        subtitle={t('cas.hero.subtitle')}
      />

      <section className="cas-sec">
        {/* AI Overview Summary Box */}
        <div className="sge-ai-box">
          <div className="sge-ai-header">
            <span className="sge-ai-badge">{t('cas.ai.badge')}</span>
            <span className="sge-ai-tag">{t('cas.ai.tag')}</span>
          </div>
          <p className="sge-ai-text">{t('cas.ai.text')}</p>
        </div>

        {/* Quick facts strip */}
        <div className="cas-stats">
          <div className="cas-stat">
            <strong>{t('cas.stats.free.title')}</strong>
            <span>{t('cas.stats.free.text')}</span>
          </div>
          {clinicCount > 0 && (
            <div className="cas-stat">
              <strong>{t('cas.stats.clinics.title', { count: clinicCount })}</strong>
              <span>{t('cas.stats.clinics.text', { count: clinicCount, names: clinicNames })}</span>
            </div>
          )}
          <div className="cas-stat">
            <strong>{t('cas.stats.direct.title')}</strong>
            <span>{t('cas.stats.direct.text')}</span>
          </div>
        </div>

        <div className="cas-grid">
          {/* Main CAS Content */}
          <div className="cas-main">
            <h2>{t('cas.children.title')}</h2>
            <p>{t('cas.children.intro')}</p>

            <ul className="cas-benefits-list">
              {['cas.children.item1', 'cas.children.item2', 'cas.children.item3', 'cas.children.item4', 'cas.children.item5'].map((key) => (
                <BenefitItem key={key} text={t(key)} />
              ))}
            </ul>

            <h2>{t('cas.adults.title')}</h2>
            <p>{t('cas.adults.intro')}</p>

            <div className="cas-services-cards">
              {['card1', 'card2', 'card3'].map((card) => (
                <div className="cas-card" key={card}>
                  <h3>{t(`cas.adults.${card}.title`)}</h3>
                  <p>{t(`cas.adults.${card}.text`)}</p>
                </div>
              ))}
            </div>

            <h2>{t('cas.steps.title')}</h2>
            <div className="cas-steps">
              {steps.map((s, i) => (
                <div key={s.title} className="cas-step">
                  <span className="cas-step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>

            <h2>{t('cas.docs.title')}</h2>
            <div className="cas-docs-grid">
              <div className="cas-doc-card">
                <h3>{t('cas.docs.children.title')}</h3>
                <p>{t('cas.docs.children.text')}</p>
              </div>
              <div className="cas-doc-card">
                <h3>{t('cas.docs.adults.title')}</h3>
                <p>{t('cas.docs.adults.text')}</p>
              </div>
            </div>

            <div className="cas-note">
              <IconAlert size={20} />
              <p>
                <strong>{t('cas.note.label')}</strong> {t('cas.note.text')}
              </p>
            </div>

            <h2>{t('cas.faq.title')}</h2>
            <div className="cas-faq-list">
              {faqs.map((f) => (
                <div key={f.q} className="cas-faq-item">
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar CTA Card */}
          <aside className="cas-sidebar">
            <div className="cas-cta-card">
              <h3>{t('cas.sidebar.title')}</h3>
              <p>{t('cas.sidebar.text')}</p>

              <button type="button" className="btn btn-dark full-width" onClick={() => openPicker('both')}>
                <IconPhone size={18} /> {t('cas.sidebar.callButton')}
              </button>

              <button type="button" onClick={() => openPicker('whatsapp')} className="btn-whatsapp full-width cas-wa-btn">
                <IconWhatsApp size={18} /> {t('cas.sidebar.whatsappButton')}
              </button>

              <div className="cas-phone-lines">
                {clinics.map((clinic) => {
                  const line = clinicPhone(clinic);
                  if (!line) return null;
                  return (
                    <a key={clinic.slug} href={`tel:${line.tel}`} className="cas-phone-line">
                      <IconMapPin size={16} color="var(--accent)" />
                      <span>
                        <small>{clinic.name}</small>
                        <strong>{line.display}</strong>
                      </span>
                    </a>
                  );
                })}
              </div>

              <div className="cas-contact-info">
                <div><IconClock size={16} color="var(--accent)" /> {t('cas.sidebar.hours')}</div>
                <div><IconAlert size={16} color="var(--green)" /> {t('cas.sidebar.note')}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom CTA banner */}
        <div className="cas-cta-banner">
          <h2>{t('cas.banner.title')}</h2>
          <p>{t('cas.banner.text', { count: clinicCount })}</p>
          <div className="cas-banner-actions">
            <button type="button" className="btn btn-white btn-lg" onClick={() => openPicker('both')}>
              <IconPhone size={18} /> {t('cas.banner.callButton')}
            </button>
            <button type="button" onClick={() => openPicker('whatsapp')} className="btn btn-outline-white btn-lg">
              <IconWhatsApp size={18} /> {t('cas.banner.whatsappButton')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
