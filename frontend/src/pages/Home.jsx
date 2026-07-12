import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { whatsappUrlFor } from '../lib/leadCapture';
import config from '../config';
import { services, trustStats } from '../data/content';
import { useSiteData } from '../public-site/SiteDataProvider';
import { useQuery } from '@tanstack/react-query';
import { fetchReviews, publicQueryKeys } from '../api/publicClient';
import Seo from '../components/seo/Seo';
import ReviewCard from '../components/ui/ReviewCard';
import TrustStrip from '../components/sections/TrustStrip';
import ProofGallery from '../components/sections/ProofGallery';
import DoctorTeam from '../components/sections/DoctorTeam';
import TechnologySection from '../components/sections/TechnologySection';
import PatientJourney from '../components/sections/PatientJourney';
import { IconPhone, IconWhatsApp, IconMapPin, IconMail, IconClock, IconFacebook, IconInstagram, IconLinkedIn } from '../components/ui/Icons';
import './Home.css';

export default function Home() {
  const revealRef = useRevealAll([]);
  const openPicker = useClinicPicker();
  const siteData = useSiteData();
  const { data: reviews = [] } = useQuery({
    queryKey: publicQueryKeys.reviews,
    queryFn: fetchReviews,
  });

  return (
    <div ref={revealRef}>
      <Seo title="DentNow - Clinica stomatologica in Bucuresti" description="DentNow este o clinica stomatologica in Bucuresti pentru consultatii, urgente, implanturi, igienizare GBT, albire, ortodontie si tratamente pentru copii." path="/" />

      <section className="hero clinical-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-clinic-label">Clinica stomatologica · Bucuresti</p>
            <h1 className="hero-clinic-name">Dent<span>Now</span></h1>
            <p className="hero-tagline">Tratament explicat clar, deviz inainte de interventie si programari rapide pentru urgente.</p>
            <div className="hero-cta-row left">
              <button type="button" onClick={() => openPicker('call')} className="cta-phone-big"><IconPhone size={18} /> Suna acum</button>
              <button type="button" onClick={() => openPicker('whatsapp')} className="cta-wa"><IconWhatsApp size={18} /> WhatsApp</button>
              <a href="#contact" className="btn btn-outline">Program si locatie</a>
            </div>
            <TrustStrip items={trustStats} />
          </div>
          <div className="hero-media-panel">
            <img src="/assets/dentnow/treatment-room.svg" alt="Ilustrație cabinet stomatologic DentNow" />
            {import.meta.env.DEV && (
              <div className="hero-media-note">
                <strong>Fotografie temporara</strong>
                <span>Inlocuieste cu fotografia reala a cabinetului in `public/assets/dentnow`.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-heading">
          <div className="stag rv">Contact, locatii si program</div>
          <h2 className="h2d rv d1">Cele 3 clinici DentNow din Bucuresti.</h2>
        </div>
        <div className="locations-grid">
          {config.locations.map((loc, i) => (
            <div className={`location-card rv${i > 0 ? ` d${i}` : ''}`} key={loc.name}>
              <div className="location-map">
                <iframe src={loc.embedUrl} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${loc.name} pe Google Maps`} />
              </div>
              <div className="location-info">
                <span className="location-area">{loc.area}</span>
                <h3 className="location-name">{loc.name}</h3>
                <p className="location-line"><IconMapPin size={16} /><span>{loc.address}</span></p>
                <p className="location-line"><IconPhone size={16} /><a href={`tel:${loc.phone}`}>{loc.phoneDisplay}</a></p>
                <p className="location-line"><IconWhatsApp size={16} /><a href={whatsappUrlFor(loc.phone, `Buna ziua, doresc o programare la ${loc.name}.`)} target="_blank" rel="noopener noreferrer">WhatsApp {loc.phoneDisplay}</a></p>
                <div className="location-line location-hours">
                  <IconClock size={16} />
                  <span>{loc.schedule.map((h) => <span key={h.day} className="loc-hour">{h.day}: {h.hours}{h.open ? '' : ' (Inchis)'}</span>)}</span>
                </div>
                <a href={loc.mapsLink} target="_blank" rel="noopener noreferrer" className="location-link">Deschide in Google Maps</a>
              </div>
            </div>
          ))}
        </div>
        <div className="contact-social rv">
          <a href={`mailto:${config.email}`} className="social-btn"><IconMail size={16} /> {config.email}</a>
          <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="social-btn"><IconFacebook size={16} /> Facebook</a>
          <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="social-btn"><IconInstagram size={16} /> Instagram</a>
          <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn"><IconLinkedIn size={16} /> LinkedIn</a>
        </div>
      </section>

      <section className="quick-services" aria-label="Servicii rapide DentNow">
        {siteData.homepage_treatments.map((t) => {
          const minPrice = t.prices && t.prices.length > 0
            ? new Intl.NumberFormat('ro-RO').format(t.prices[0].amount || 0) + ' ' + (t.prices[0].currency || 'lei')
            : '';
          return (
            <Link to={`/tratamente#${t.slug}`} key={t.slug} className="quick-service-card">
              <span>{t.homepage_icon || 'Tooth'}</span>
              <strong>{t.homepage_label || t.name}</strong>
              <small>{minPrice ? `de la ${minPrice}` : ''}</small>
            </Link>
          );
        })}
      </section>

      <section className="services-section" id="servicii">
        <div className="services-header">
          <div className="stag rv">Servicii DentNow</div>
          <h2 className="h2d rv d1">Tratamente uzuale, explicate pe intelesul pacientului.</h2>
          <p className="lead rv d2">Am redus promisiunile vagi si am pastrat lucrurile care ajuta pacientul sa decida: serviciu, pret de pornire, pas urmator.</p>
        </div>
        <div className="services-grid">
          {services.map((s, i) => (
            <Link to={s.link} key={s.title} className={`service-card rv${i > 0 ? ` d${i % 3}` : ''}`}>
              <span className="svc-icon">{s.icon}</span>
              <div className="svc-arrow">↗</div>
              <h3 className="svc-title">{s.title}</h3>
              <p className="svc-desc">{s.desc}</p>
            </Link>
          ))}
        </div>
        <div className="section-action">
          <Link to="/tratamente" className="btn btn-dark">Vezi tratamente si tarife</Link>
        </div>
      </section>

      <ProofGallery />
      <DoctorTeam />
      <TechnologySection />
      <PatientJourney />

      <section className="testi-section">
        <div className="testi-header">
          <div className="stag rv">Recenzii pacienti</div>
          <h2 className="h2d rv d1">Experiente recente, de verificat inainte de lansare.</h2>
          <p className="lead rv d2">Pastreaza doar recenzii verificate si actualizeaza ratingul cu sursa reala.</p>
        </div>
        <div className="reviews-static-grid">
          {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id || r.author} review={r} />)}
        </div>
        <div className="section-action">
          <Link to="/recenzii" className="btn btn-dark">Vezi recenziile</Link>
        </div>
      </section>

    </div>
  );
}
