import { Link } from 'react-router-dom';
import { footerServices, footerClinic } from '../../data/navigation';
import config from '../../config';
import { IconFacebook, IconInstagram, IconWhatsApp, IconLinkedIn } from '../ui/Icons';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" data-nav-dark>
      <div className="footer-top">
        <div>
          <Link to="/" className="footer-logo">Dent<span>Now</span></Link>
          <p className="footer-desc">
            Clinică stomatologică modernă în București. Servicii complete cu echipamente de ultimă generație și o echipă dedicată sănătății tale dentare. Lucrăm cu CAS — copii gratuit.
          </p>
          <div className="footer-social">
            <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"><IconFacebook size={20} /></a>
            <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"><IconInstagram size={20} /></a>
            <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"><IconLinkedIn size={20} /></a>
            <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp"><IconWhatsApp size={20} /></a>
          </div>
        </div>
        <div>
          <p className="footer-col-title">Servicii</p>
          <ul className="footer-links">
            {footerServices.map((s) => <li key={s.to}><Link to={s.to}>{s.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="footer-col-title">Clinica</p>
          <ul className="footer-links">
            {footerClinic.map((c) => <li key={c.to}><Link to={c.to}>{c.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="footer-col-title">Contact &amp; locatii</p>
          <ul className="footer-links">
            {config.phones.map((p) => (
              <li key={p.tel} className="footer-phone">
                <span className="footer-loc-area">{p.label}</span>
                <span className="footer-phone-actions">
                  <a href={`tel:${p.tel}`}>{p.display}</a>
                  <a href={p.whatsapp} target="_blank" rel="noopener noreferrer" className="footer-wa">WhatsApp</a>
                </span>
              </li>
            ))}
            <li><a href={`mailto:${config.email}`}>{config.email}</a></li>
            {config.locations.map((loc) => (
              <li key={loc.name}><a href={loc.mapsLink} target="_blank" rel="noopener noreferrer">{loc.name}<br /><span className="footer-loc-area">{loc.area}</span></a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© {new Date().getFullYear()} DentNow. Toate drepturile rezervate.</p>
        <div className="footer-legal">
          <Link to="/gdpr">GDPR</Link>
          <Link to="/confidentialitate">Confidențialitate</Link>
          <Link to="/termeni">Termeni</Link>
        </div>
      </div>
    </footer>
  );
}
