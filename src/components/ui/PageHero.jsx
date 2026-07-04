export default function PageHero({ tag, title, subtitle, dark = false, children }) {
  return (
    <div className={`page-hero${dark ? ' dark' : ''}`} {...(dark ? { 'data-nav-dark': true } : {})}>
      {dark && <div className="page-hero-glow" />}
      {tag && <div className="stag" style={dark ? { position: 'relative', zIndex: 1 } : {}}>{tag}</div>}
      {title && (
        <h1
          className="h2d rv d1"
          style={{
            margin: '16px auto 16px',
            ...(dark ? { color: '#f5f5f7', position: 'relative', zIndex: 1 } : {}),
          }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      {subtitle && (
        <p
          className={`lead rv d2${dark ? ' lt' : ''}`}
          style={{
            maxWidth: 540, margin: '0 auto',
            ...(dark ? { position: 'relative', zIndex: 1 } : {}),
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
