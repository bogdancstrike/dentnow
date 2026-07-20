import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { whatsappUrlFor } from '../lib/leadCapture';
import { useSiteData } from '../public-site/SiteDataProvider';
import { siteLinkHref } from '../lib/siteContent';
import { mediaUrl } from '../api/publicClient';
import { useReviews } from '../hooks/useReviews';
import Seo from '../components/seo/Seo';
import ReviewCard from '../components/ui/ReviewCard';
import TrustStrip from '../components/sections/TrustStrip';
import ProofGallery from '../components/sections/ProofGallery';
import DoctorTeam from '../components/sections/DoctorTeam';
import TechnologySection from '../components/sections/TechnologySection';
import PatientJourney from '../components/sections/PatientJourney';
import { IconPhone, IconWhatsApp, IconMapPin, IconMail, IconClock, IconFacebook, IconInstagram, IconLinkedIn } from '../components/ui/Icons';
import './Home.css';

function LocationCard({ loc }) {
  const phoneContact = loc.contacts.find((c) => c.kind === 'phone');
  const phoneDisplay = phoneContact?.display_value || '';
  const phoneTel = phoneContact?.url?.replace('tel:', '') || '';
  const embedUrl = loc.map_embed_url;
  const mapsLink = loc.map_link_url;

  return (
    <div className="location-card gallery-photo">
      <div className="location-map">
        {embedUrl && <iframe src={embedUrl} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${loc.name} pe Google Maps`} />}
      </div>
      <div className="location-info">
        <span className="location-area">{loc.area}</span>
        <h3 className="location-name">{loc.name}</h3>
        <p className="location-line"><IconMapPin size={16} /><span>{loc.address_full}</span></p>
        <p className="location-line"><IconPhone size={16} /><a href={`tel:${phoneTel}`}>{phoneDisplay}</a></p>
        <p className="location-line"><IconWhatsApp size={16} /><a href={whatsappUrlFor(phoneTel, `Buna ziua, doresc o programare la ${loc.name}.`)} target="_blank" rel="noopener noreferrer">WhatsApp {phoneDisplay}</a></p>
        <div className="location-line location-hours">
          <IconClock size={16} />
          <span>
            {loc.hours.map((h) => {
              const dayNames = ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata', 'Duminica'];
              const dayName = dayNames[h.weekday] || 'Zi';
              const hoursStr = h.closed ? '(Inchis)' : `${h.opens_at?.substring(0, 5) || ''} - ${h.closes_at?.substring(0, 5) || ''}`;
              return <span key={h.weekday} className="loc-hour">{dayName}: {hoursStr}</span>;
            })}
          </span>
        </div>
        {mapsLink && <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="location-link">Deschide in Google Maps</a>}
      </div>
    </div>
  );
}

export function ContactClinics({ clinics }) {
  const t = useSiteTexts();
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(clinics.length - 1, 0));
  const current = clinics[safeIndex];
  const prev = () => setIndex((i) => (i <= 0 ? clinics.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % clinics.length);

  return (
    <>
      <div className="contact-heading">
        <div className="stag rv">{t('home.contact.tag')}</div>
        <h2 className="h2d rv d1">{t('home.contact.title', { count: clinics.length })}</h2>
      </div>
      {current ? (
        <div className="gallery-shell locations-gallery">
          <div>
            <LocationCard loc={current} />
            {clinics.length > 1 && (
              <div className="gallery-controls">
                <button className="icon-btn" type="button" onClick={prev} aria-label="Clinica anterioara">‹</button>
                <button className="icon-btn" type="button" onClick={next} aria-label="Clinica urmatoare">›</button>
              </div>
            )}
          </div>
          <div className="gallery-list">
            {clinics.map((loc, i) => (
              <button
                className={`gallery-thumb${i === safeIndex ? ' active' : ''}`}
                type="button"
                onClick={() => setIndex(i)}
                key={loc.slug}
              >
                <span className="loc-thumb-icon">📍</span>
                <span>
                  <strong>{loc.name}</strong>
                  <span>{loc.area} — {loc.address_full}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="locations-empty">Clinicile vor apărea aici imediat ce sunt publicate.</p>
      )}
    </>
  );
}

export default function Home() {
  const openPicker = useClinicPicker();
  const t = useSiteTexts();
  const siteData = useSiteData();
  const email = siteData.links.find((link) => link.kind === 'email');
  const socialLinks = siteData.links.filter((link) => link.kind === 'social');
  const { data: reviews = [] } = useReviews();
  const homepageServices = siteData.homepage_services || [];
  const hero = siteData.pages?.['/']?.sections?.find((section) => section.block_type === 'home_hero')?.payload || {};
  const heroImage = hero.media_id
    ? mediaUrl(String(hero.media_id), 'hero')
    : typeof hero.media === 'string' ? hero.media : null;
  const trustItems = [1, 2, 3].map((i) => ({
    value: t(`home.trust.${i}.title`),
    accent: '',
    label: t(`home.trust.${i}.text`),
  }));

  const revealRef = useRevealAll([reviews]);

  return (
    <div ref={revealRef}>
      <Seo path="/" />

      <section className="hero clinical-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-clinic-label">{t('home.hero.label')}</p>
            <h1 className="hero-clinic-name">{siteData.site.site_name}</h1>
            <p className="hero-tagline">{t('home.hero.tagline')}</p>
            <div className="hero-cta-row left">
              <button type="button" onClick={() => openPicker('call')} className="cta-phone-big"><IconPhone size={18} /> {t('home.hero.callButton')}</button>
              <button type="button" onClick={() => openPicker('whatsapp')} className="cta-wa"><IconWhatsApp size={18} /> {t('home.hero.whatsappButton')}</button>
              <a href="#contact" className="btn btn-outline">{t('home.hero.contactButton')}</a>
            </div>
            <TrustStrip items={trustItems} />
          </div>
          {heroImage && <div className="hero-media-panel">
            <img src={heroImage} alt={typeof hero.alt_text === 'string' ? hero.alt_text : ''} />
          </div>}
        </div>
      </section>

      <section className="contact-section" id="contact">
      <ContactClinics clinics={siteData.clinics} openPicker={openPicker} />
        <div className="contact-social rv">
          {email && <a href={siteLinkHref(email)} className="social-btn"><IconMail size={16} /> {email.display_value || email.value}</a>}
          {socialLinks.map((social) => {
            const label = social.label.toLowerCase();
            const Icon = label === 'facebook' ? IconFacebook : label === 'instagram' ? IconInstagram : label === 'linkedin' ? IconLinkedIn : null;
            if (!Icon || !siteLinkHref(social)) return null;
            return <a key={social.label} href={siteLinkHref(social)} target="_blank" rel="noopener noreferrer" className="social-btn"><Icon size={16} /> {social.label}</a>;
          })}
        </div>
      </section>

      {homepageServices.length > 0 && <section className="services-section" id="servicii">
        <div className="services-header">
          <div className="stag rv">{t('home.services.tag')}</div>
          <h2 className="h2d rv d1">{t('home.services.title')}</h2>
          <p className="lead rv d2">{t('home.services.lead')}</p>
        </div>
        <div className="services-grid">
          {homepageServices.map((service, i) => (
            <Link to={service.link || '/tratamente'} key={service.title} className={`service-card rv${i > 0 ? ` d${i % 3}` : ''}`}>
              {service.icon && <span className="svc-icon">{service.icon}</span>}
              <div className="svc-arrow">↗</div>
              <h3 className="svc-title">{service.title}</h3>
              {service.description && <p className="svc-desc">{service.description}</p>}
            </Link>
          ))}
        </div>
        <div className="section-action">
          <Link to="/tratamente" className="btn btn-dark">{t('home.services.cta')}</Link>
        </div>
      </section>}

      <ProofGallery />
      <DoctorTeam />
      <TechnologySection />
      <PatientJourney />

      <section className="testi-section" id="recenzii">
        <div className="testi-header">
          <div className="stag rv">{t('home.reviews.tag')}</div>
          <h2 className="h2d rv d1">{t('home.reviews.title')}</h2>
          <p className="lead rv d2">{t('home.reviews.lead')}</p>
        </div>
        <div className="reviews-static-grid">
          {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id || r.author} review={r} />)}
        </div>
        <div className="section-action">
          <Link to="/recenzii" className="btn btn-dark">{t('home.reviews.cta')}</Link>
        </div>
      </section>

    </div>
  );
}
