import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTreatments, publicQueryKeys } from '../../api/publicClient';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import { whatsappUrlFor } from '../../lib/leadCapture';
import { IconFacebook, IconInstagram, IconWhatsApp, IconLinkedIn } from '../ui/Icons';
import './Footer.css';

const RESOURCE_LINKS = [
  { label: 'Oferte', to: '/oferte' },
  { label: 'Articole', to: '/articole' },
  { label: 'Noutăți', to: '/noutati' },
  { label: 'Before & After', to: '/before-after' },
  { label: 'Scor igienă orală', to: '/scor-igiena' },
  { label: 'E-bookuri', to: '/ebook' },
  { label: 'Parteneri', to: '/parteneri' },
];

function SocialIcon({ label }) {
  const normalized = label.toLowerCase();
  if (normalized === 'facebook') return <IconFacebook size={20} />;
  if (normalized === 'instagram') return <IconInstagram size={20} />;
  if (normalized === 'linkedin') return <IconLinkedIn size={20} />;
  return null;
}

export default function Footer() {
  const siteData = useSiteData();
  const t = useSiteTexts();
  const { data: treatments = [] } = useQuery({
    queryKey: publicQueryKeys.treatments,
    queryFn: fetchTreatments,
    staleTime: 60_000,
  });
  const email = siteData.links.find((link) => link.kind === 'email');
  const socialLinks = siteData.links.filter(
    (link) => link.kind === 'social' && ['facebook', 'instagram', 'linkedin'].includes(link.label.toLowerCase()),
  );
  const serviceLinks = treatments.slice(0, 6).map((treatment) => ({
    label: treatment.name,
    to: `/tratamente/${treatment.slug}`,
  }));

  return (
    <footer className="footer" data-nav-dark>
      <div className="footer-top">
        <div>
          <Link to="/" className="footer-logo">Dent<span>Now</span></Link>
          <p className="footer-desc">{t('footer.description')}</p>
          <div className="footer-social">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url || social.value}
                target="_blank"
                rel="noopener noreferrer"
                title={social.label}
                aria-label={social.label}
              >
                <SocialIcon label={social.label} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="footer-col-title">Servicii</p>
          <ul className="footer-links">
            <li><Link to="/tratamente">Toate tratamentele și tarifele</Link></li>
            {serviceLinks.map((service) => <li key={service.to}><Link to={service.to}>{service.label}</Link></li>)}
            <li><Link to="/urgente-dentare-bucuresti">Urgențe dentare</Link></li>
            <li><Link to="/decontat-cas">Decontare CAS</Link></li>
          </ul>
        </div>

        <div>
          <p className="footer-col-title">Clinici</p>
          <ul className="footer-links">
            {siteData.clinics.map((clinic) => (
              <li key={clinic.slug}>
                <Link to={`/locatii/${clinic.slug}`}>
                  {clinic.name}<br />
                  <span className="footer-loc-area">{clinic.area || clinic.address_full}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-col-title">Resurse</p>
          <ul className="footer-links">
            {RESOURCE_LINKS.map((resource) => <li key={resource.to}><Link to={resource.to}>{resource.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <p className="footer-col-title">Contact &amp; locații</p>
          <ul className="footer-links footer-contact-list">
            {email ? <li><a href={email.url || `mailto:${email.value}`}>{email.display_value || email.value}</a></li> : null}
            {siteData.clinics.map((clinic) => {
              const phone = clinic.contacts.find((contact) => contact.kind === 'phone');
              const whatsapp = clinic.contacts.find((contact) => contact.kind === 'whatsapp');
              const phoneValue = phone?.normalized_value || phone?.display_value || '';
              return (
                <li key={clinic.slug} className="footer-phone">
                  <Link to={`/locatii/${clinic.slug}`} className="footer-contact-clinic">{clinic.name}</Link>
                  <span className="footer-phone-actions">
                    {phone ? <a href={phone.url || `tel:${phoneValue}`}>{phone.display_value}</a> : null}
                    {(whatsapp || phone) ? (
                      <a
                        href={whatsapp?.url || whatsappUrlFor(whatsapp?.normalized_value || phoneValue, `Bună ziua, doresc o programare la ${clinic.name}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-wa"
                      >
                        <IconWhatsApp size={14} /> WhatsApp
                      </a>
                    ) : null}
                    {clinic.map_link_url ? (
                      <a href={clinic.map_link_url} target="_blank" rel="noopener noreferrer" className="footer-map-link">Hartă</a>
                    ) : null}
                  </span>
                </li>
              );
            })}
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
