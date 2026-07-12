import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useClinicPicker } from '../hooks/useClinicPicker';
import { whatsappUrlFor } from '../lib/leadCapture';
import config from '../config';
import { trustStats, services } from '../data/content';
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

function LocationCard({ loc, className }) {
  const phoneContact = loc.contacts.find((c) => c.kind === 'phone');
  const phoneDisplay = phoneContact?.display_value || '';
  const phoneTel = phoneContact?.url?.replace('tel:', '') || '';
  const embedUrl = loc.map_embed_url;
  const mapsLink = loc.map_link_url;

  return (
    <div className={`location-card${className ? ` ${className}` : ''}`}>
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
              const dayNames = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
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

function ContactClinics({ clinics }) {
  const [index, setIndex] = useState(0);
  const useCarousel = clinics.length > 3;
  const current = clinics[index];
  const prev = () => setIndex((i) => (i === 0 ? clinics.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % clinics.length);

  return (
    <>
      <div className="contact-heading">
        <div className="stag rv">Contact, locatii si program</div>
        <h2 className="h2d rv d1">Cele {clinics.length} clinici DentNow din Bucuresti.</h2>
      </div>
      {useCarousel ? (
        <div className="gallery-shell locations-gallery">
          <div>
            <LocationCard loc={current} />
            <div className="gallery-controls">
              <button className="icon-btn" type="button" onClick={prev} aria-label="Clinica anterioara">‹</button>
              <button className="icon-btn" type="button" onClick={next} aria-label="Clinica urmatoare">›</button>
            </div>
          </div>
          <div className="gallery-list">
            {clinics.map((loc, i) => (
              <button
                className={`gallery-thumb${i === index ? ' active' : ''}`}
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
        <div className="locations-grid">
          {clinics.map((loc, i) => (
            <LocationCard key={loc.slug} loc={loc} className={`rv${i > 0 ? ` d${i}` : ''}`} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Home() {
  const openPicker = useClinicPicker();
  const siteData = useSiteData();
  const { data: reviews = [] } = useQuery({
    queryKey: publicQueryKeys.reviews,
    queryFn: fetchReviews,
  });

  const revealRef = useRevealAll([reviews]);

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
      <ContactClinics clinics={siteData.clinics} openPicker={openPicker} />
        <div className="contact-social rv">
          <a href={`mailto:${config.email}`} className="social-btn"><IconMail size={16} /> {config.email}</a>
          <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="social-btn"><IconFacebook size={16} /> Facebook</a>
          <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="social-btn"><IconInstagram size={16} /> Instagram</a>
          <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn"><IconLinkedIn size={16} /> LinkedIn</a>
        </div>
      </section>

      <section className="services-section" id="servicii">
        <div className="services-header">
          <div className="stag rv">Servicii DentNow</div>
          <h2 className="h2d rv d1">Tratamente uzuale, explicate pe intelesul pacientului.</h2>
          <p className="lead rv d2">Am redus promisiunile vagi si am pastrat lucrurile care ajuta pacientul sa decida: serviciu, pret de pornire, pas urmator.</p>
        </div>
        <div className="services-grid">
          {(siteData.homepage_services && siteData.homepage_services.length > 0
            ? siteData.homepage_services.map((s) => ({ icon: s.icon, title: s.title, desc: s.description, link: s.link || '/tratamente' }))
            : services
          ).map((s, i) => (
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
