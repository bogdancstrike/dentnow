import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';
import { useDragScroll } from '../hooks/useDragScroll';
import config from '../config';
import { services, quickServices, whyItems, trustStats, scheduleHours } from '../data/content';
import { reviews } from '../data/reviews';
import ReviewCard from '../components/ui/ReviewCard';
import { IconPhone, IconWhatsApp, IconMapPin, IconMail, IconClock, IconFacebook, IconInstagram, IconGlobe } from '../components/ui/Icons';
import './Home.css';

export default function Home() {
  const revealRef = useRevealAll([]);
  const scrollRef = useDragScroll();

  return (
    <div ref={revealRef}>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-top">
          <p className="hero-clinic-label">Clinică Stomatologică · București</p>
          <h1 className="hero-clinic-name">Dent<span>Now</span></h1>
          <p className="hero-tagline">Implanturi · Albire · Ortodonție · Obturații · Endodonție</p>
        </div>

        <div className="hero-body">
          <div className="hero-strip">
            <div className="hs-cell"><div className="hs-label">Telefon</div><div className="hs-value"><a href={`tel:${config.phone}`}>{config.phoneDisplay}</a></div></div>
            <div className="hs-cell"><div className="hs-label">Adresă</div><div className="hs-value">{config.address.street}<br /><span style={{ color: '#a0aec0', fontSize: 12 }}>{config.address.detail}</span></div></div>
            <div className="hs-cell"><div className="hs-label">Program</div><div className="hs-value green"><strong>Lun–Vin</strong> 09:00–19:00 &nbsp;·&nbsp; <strong>Sâm</strong> 09:00–15:00</div></div>
            <div className="hs-cell"><div className="hs-label">Card de sănătate</div><div className="hs-value green"><strong>Acceptăm CAS</strong> &nbsp;·&nbsp; Copii — <strong>gratuit</strong></div></div>
            <div className="hs-cell"><div className="hs-label">Urgențe</div><div className="hs-value orange"><strong>Tratăm prioritar</strong> &nbsp;·&nbsp; <a href={`tel:${config.phone}`} style={{ color: '#ea580c' }}>{config.phoneDisplay}</a></div></div>
          </div>

          {/* Map — stretches to match strip height */}
          <div className="hero-map-box">
            <iframe src={config.maps.embedUrl} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="DentNow pe Google Maps" />
            <a href={config.maps.link} target="_blank" rel="noopener noreferrer" className="hero-map-link">
              <IconMapPin size={14} /> Deschide în Google Maps
            </a>
          </div>
        </div>

        <div className="hero-cta-row">
          <a href={`tel:${config.phone}`} className="cta-phone-big"><IconPhone size={18} color="#fff" /> {config.phoneDisplay}</a>
          <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="cta-wa"><IconWhatsApp size={18} color="#fff" /> WhatsApp</a>
        </div>

        <div className="hero-trust">
          {trustStats.map((s, i) => (
            <div className="ht-item" key={i}>
              <div className="ht-val" style={s.smallFont ? { fontSize: 'clamp(14px,2vw,22px)' } : {}}>{s.value}{s.accent && <span>{s.accent}</span>}</div>
              <div className="ht-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ QUICK SERVICES ═══ */}
      <div className="stats-bar">
        {quickServices.map((qs, i) => (
          <Link to={qs.link} key={i} className={`stat-item rv${i > 0 ? ` d${i}` : ''}`} style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="stat-num" style={{ fontSize: 28 }}>{qs.icon}</div>
            <div className="stat-lbl" style={{ fontWeight: 600, color: 'var(--black)', marginTop: 4 }}>{qs.label}</div>
            <div className="stat-lbl">de la <strong style={{ color: 'var(--accent)' }}>{qs.price}</strong></div>
          </Link>
        ))}
      </div>

      {/* ═══ DARK STATEMENT ═══ */}
      <section className="dark-stmt" data-nav-dark>
        <div className="glow" />
        <p className="eyebrow lt rv">Filozofia noastră</p>
        <h2 className="h2d rv d1" style={{ color: '#f5f5f7', maxWidth: 760, margin: '0 auto 28px' }}>Stomatologie modernă,<br /><em className="ac">fără compromisuri.</em></h2>
        <p className="lead lt rv d2" style={{ maxWidth: 520, margin: '0 auto' }}>Combinăm tehnologia dentară de ultimă generație cu o abordare caldă și personalizată.</p>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="services-section" id="servicii">
        <div className="services-header">
          <div className="stag rv">Servicii Complete</div>
          <h2 className="h2d rv d1" style={{ maxWidth: 560, margin: '12px auto 18px' }}>Tot ce ai nevoie,<br />în același cabinet.</h2>
          <p className="lead rv d2">De la controale de rutină până la implantologie complexă.</p>
        </div>
        <div className="services-grid">
          {services.map((s, i) => (
            <Link to={s.link} key={i} className={`service-card rv${i > 0 ? ` d${i % 3}` : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="svc-icon">{s.icon}</span>
              <div className="svc-arrow">↗</div>
              <h3 className="svc-title">{s.title}</h3>
              <p className="svc-desc" dangerouslySetInnerHTML={{ __html: s.desc }} />
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/tratamente" className="btn btn-dark">Vezi toate tarifele →</Link>
        </div>
      </section>

      {/* ═══ WHY ═══ */}
      <section className="why-section" data-nav-dark>
        <p className="eyebrow lt rv" style={{ textAlign: 'center', display: 'block' }}>De ce DentNow?</p>
        <div className="why-grid">
          <div>
            <h2 className="why-headline rv">Calitate<br /><em className="ac">fără</em><br />compromis.</h2>
            <p className="why-body rv d1">Investim constant în tehnologie, formare și experiența pacientului.</p>
            <a href={`tel:${config.phone}`} className="btn btn-white rv d2"><IconPhone size={16} /> Sună pentru programare</a>
          </div>
          <div>
            {whyItems.map((w, i) => (
              <div className={`why-item rv${i > 0 ? ` d${i}` : ''}`} key={i}>
                <div className="why-num">{w.num}</div>
                <div>
                  <div className="why-item-title">{w.title}</div>
                  <div className="why-item-text">{w.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="testi-section">
        <div className="testi-header">
          <div className="stag rv">Recenzii Pacienți Google</div>
          <h2 className="h2d rv d1" style={{ margin: '12px 0 16px' }}>Ce spun <em className="ac">pacienții noștri.</em></h2>
          <p className="lead rv d2">Rating pe Google Reviews</p>
        </div>
        <div className="hscroll rv" ref={scrollRef} style={{ padding: 0 }}>
          <div className="htrack testi-scroll-wrap">
            {reviews.slice(0, 10).map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/recenzii" className="btn btn-dark">Vezi toate recenziile →</Link>
        </div>
      </section>

      {/* ═══ CTA + CONTACT + PROGRAM — UNIFIED ═══ */}
      <section className="cta-banner" data-nav-dark>
        <div className="cta-glow" />
        <p className="eyebrow lt rv">Primul pas e simplu</p>
        <h2 className="cta-title rv d1">Programează-te<br /><em className="ac">astăzi.</em></h2>
        <p className="lead lt rv d2" style={{ maxWidth: 460, margin: '0 auto', position: 'relative', zIndex: 1 }}>Consultația inițială este gratuită. Descoperă ce poate face DentNow pentru zâmbetul tău.</p>
        <div className="cta-buttons rv d3">
          <a href={`tel:${config.phone}`} className="btn btn-white btn-lg"><IconPhone size={18} /> {config.phoneDisplay}</a>
          <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white btn-lg"><IconWhatsApp size={18} /> WhatsApp</a>
        </div>
      </section>

      {/* ═══ CONTACT & PROGRAM — MERGED ═══ */}
      <section className="contact-section" id="contact">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="stag rv">Contact, Locație &amp; Program</div>
          <h2 className="h2d rv d1" style={{ margin: '12px 0 18px' }}>Suntem <em className="ac">aproape de tine.</em></h2>
        </div>
        <div className="contact-grid">
          <div>
            <h3 className="h3d rv" style={{ marginBottom: 32 }}>Informații</h3>
            <ContactItem icon={<IconMapPin size={18} />} label="Adresă" rv="rv">
              {config.address.full}<br />
              <a href={config.maps.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>→ Deschide în Google Maps</a>
            </ContactItem>
            <ContactItem icon={<IconPhone size={18} />} label="Telefon" rv="rv d1"><a href={`tel:${config.phone}`}>{config.phoneDisplay}</a></ContactItem>
            <ContactItem icon={<IconMail size={18} />} label="Email" rv="rv d2"><a href={`mailto:${config.email}`}>{config.email}</a></ContactItem>
            <ContactItem icon={<IconClock size={18} />} label="Program" rv="rv d3">
              {scheduleHours.map((h, i) => (
                <span key={i}>{h.day}: {h.hours}{h.open ? '' : ' (Închis)'}{i < scheduleHours.length - 1 && <br />}</span>
              ))}
            </ContactItem>

            <div className="urgenta-box rv" style={{ marginTop: 20 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🚨</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Urgențe dentare</div>
                <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.5 }}>Sunați la <a href={`tel:${config.phone}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{config.phoneDisplay}</a></p>
              </div>
            </div>

            <div className="social-links rv">
              <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="social-btn"><IconFacebook size={16} /> Facebook</a>
              <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-btn"><IconWhatsApp size={16} /> WhatsApp</a>
              <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="social-btn"><IconInstagram size={16} /> Instagram</a>
              <a href={config.social.website} target="_blank" rel="noopener noreferrer" className="social-btn"><IconGlobe size={16} /> Website</a>
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
