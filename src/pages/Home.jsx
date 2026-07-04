import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { services, quickServices, trustStats, scheduleHours } from '../data/content';
import { reviews } from '../data/reviews';
import Seo from '../components/seo/Seo';
import ReviewCard from '../components/ui/ReviewCard';
import AppointmentPanel from '../components/sections/AppointmentPanel';
import TrustStrip from '../components/sections/TrustStrip';
import ProofGallery from '../components/sections/ProofGallery';
import DoctorTeam from '../components/sections/DoctorTeam';
import TechnologySection from '../components/sections/TechnologySection';
import PatientJourney from '../components/sections/PatientJourney';
import { IconPhone, IconWhatsApp, IconMapPin, IconMail, IconClock, IconFacebook, IconInstagram } from '../components/ui/Icons';
import './Home.css';

export default function Home() {
  const revealRef = useRevealAll([]);

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
              <a href={`tel:${config.phone}`} className="cta-phone-big"><IconPhone size={18} /> {config.phoneDisplay}</a>
              <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="cta-wa"><IconWhatsApp size={18} /> WhatsApp</a>
              <a href="#programare" className="btn btn-outline">Programare online</a>
            </div>
            <TrustStrip items={trustStats} />
          </div>
          <div className="hero-media-panel">
            <img src="/assets/dentnow/treatment-room.svg" alt="Placeholder pentru cabinetul DentNow" />
            <div className="hero-media-note">
              <strong>Fotografie temporara</strong>
              <span>Inlocuieste cu fotografia reala a cabinetului in `public/assets/dentnow`.</span>
            </div>
          </div>
          <div id="programare" className="hero-appointment">
            <AppointmentPanel compact selectedService="Consultatie" source="homepage hero" />
          </div>
        </div>
      </section>

      <section className="quick-services" aria-label="Servicii rapide DentNow">
        {quickServices.map((qs) => (
          <Link to={qs.link} key={qs.label} className="quick-service-card">
            <span>{qs.icon}</span>
            <strong>{qs.label}</strong>
            <small>de la {qs.price}</small>
          </Link>
        ))}
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
          {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
        <div className="section-action">
          <Link to="/recenzii" className="btn btn-dark">Vezi recenziile</Link>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-heading">
          <div className="stag rv">Contact, locatie si program</div>
          <h2 className="h2d rv d1">Gaseste usor clinica DentNow.</h2>
        </div>
        <div className="contact-grid">
          <div>
            <h3 className="h3d rv">Informatii utile</h3>
            <ContactItem icon={<IconMapPin size={18} />} label="Adresa" rv="rv">
              {config.address.full}<br />
              <a href={config.maps.link} target="_blank" rel="noopener noreferrer">Deschide in Google Maps</a>
            </ContactItem>
            <ContactItem icon={<IconPhone size={18} />} label="Telefon" rv="rv d1"><a href={`tel:${config.phone}`}>{config.phoneDisplay}</a></ContactItem>
            <ContactItem icon={<IconMail size={18} />} label="Email" rv="rv d2"><a href={`mailto:${config.email}`}>{config.email}</a></ContactItem>
            <ContactItem icon={<IconClock size={18} />} label="Program" rv="rv d3">
              {scheduleHours.map((h, i) => <span key={h.day}>{h.day}: {h.hours}{h.open ? '' : ' (Inchis)'}{i < scheduleHours.length - 1 && <br />}</span>)}
            </ContactItem>
            <div className="social-links rv">
              <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="social-btn"><IconFacebook size={16} /> Facebook</a>
              <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-btn"><IconWhatsApp size={16} /> WhatsApp</a>
              <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="social-btn"><IconInstagram size={16} /> Instagram</a>
            </div>
          </div>
          <div className="map-wrapper rv d1">
            <iframe src={config.maps.embedUrl} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="DentNow pe Google Maps" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactItem({ icon, label, rv, children }) {
  return (
    <div className={`contact-item ${rv}`}>
      <div className="ci-icon">{icon}</div>
      <div>
        <div className="ci-label">{label}</div>
        <div className="ci-value">{children}</div>
      </div>
    </div>
  );
}
