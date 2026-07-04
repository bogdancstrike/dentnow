import config from '../../config';
import { IconPhone } from './Icons';

export function SectionTag({ children }) {
  return <div className="stag rv">{children}</div>;
}

export function DarkCTA({ eyebrow, title, subtitle, showButtons = true }) {
  return (
    <section className="dark-cta" data-nav-dark>
      {eyebrow && <p className="eyebrow lt rv">{eyebrow}</p>}
      {title && <h2 className="h3d rv" dangerouslySetInnerHTML={{ __html: title }} />}
      {subtitle && <p className="lead lt rv d1">{subtitle}</p>}
      {showButtons && <a href={`tel:${config.phone}`} className="btn btn-white btn-lg"><IconPhone size={18} /> {config.phoneDisplay}</a>}
    </section>
  );
}

export function LegalPage({ tag = 'Legal', title, date, children }) {
  return (
    <>
      <div className="page-hero">
        <div className="stag">{tag}</div>
        <h1 className="h2d">{title}</h1>
        {date && <p className="lead">Ultima actualizare: {date}</p>}
      </div>
      <div className="legal-page">
        {children}
      </div>
    </>
  );
}
