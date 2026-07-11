import { useClinicPicker } from '../../hooks/useClinicPicker';
import { IconPhone } from './Icons';

export function SectionTag({ children }) {
  return <div className="stag rv">{children}</div>;
}

export function DarkCTA({ eyebrow, title, subtitle, showButtons = true }) {
  const openPicker = useClinicPicker();
  return (
    <section className="dark-cta" data-nav-dark>
      {eyebrow && <p className="eyebrow lt rv">{eyebrow}</p>}
      {title && <h2 className="h3d rv" dangerouslySetInnerHTML={{ __html: title }} />}
      {subtitle && <p className="lead lt rv d1">{subtitle}</p>}
      {showButtons && <button type="button" onClick={() => openPicker('call')} className="btn btn-white btn-lg"><IconPhone size={18} /> Suna acum</button>}
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
