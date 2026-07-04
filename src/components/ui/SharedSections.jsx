import config from '../../config';

export function SectionTag({ children }) {
  return <div className="stag rv">{children}</div>;
}

export function DarkCTA({ eyebrow, title, subtitle, showButtons = true }) {
  return (
    <section style={{ background: 'var(--dark)', padding: '80px 48px', textAlign: 'center' }} data-nav-dark>
      {eyebrow && <p className="eyebrow lt rv">{eyebrow}</p>}
      {title && <h2 className="h3d rv" style={{ color: '#f5f5f7', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: title }} />}
      {subtitle && <p className="lead lt rv d1" style={{ maxWidth: 460, margin: '0 auto 36px' }}>{subtitle}</p>}
      {showButtons && (
        <a href={`tel:${config.phone}`} className="btn btn-white btn-lg"><span>📞</span> {config.phoneDisplay}</a>
      )}
    </section>
  );
}

export function LegalPage({ tag = 'Legal', title, date, children }) {
  return (
    <>
      <div className="page-hero">
        <div className="stag">{tag}</div>
        <h1 className="h2d" style={{ margin: '16px 0' }}>{title}</h1>
        {date && <p className="lead">Ultima actualizare: {date}</p>}
      </div>
      <div style={{ maxWidth: 800, margin: '60px auto 80px', padding: '0 48px', fontSize: 16, lineHeight: 1.8, color: 'var(--gray)' }}>
        {children}
      </div>
    </>
  );
}
