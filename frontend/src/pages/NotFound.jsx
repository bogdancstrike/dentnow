import Seo from '../components/seo/Seo';
import { StatusPage } from '../shared/StatusPage';
import { useLocation } from 'react-router-dom';
import { useSiteData } from '../public-site/SiteDataProvider';

export default function NotFound() {
  const { pathname } = useLocation();
  const { pages } = useSiteData();
  
  const page = pages[pathname] || pages[pathname.replace(/\/$/, '')];
  
  if (page) {
    return (
      <div className="dynamic-page" style={{ paddingTop: '80px', minHeight: '60vh' }}>
        <Seo title={page.seo?.title || page.title} description={page.seo?.description || ''} path={pathname} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
          <h1 style={{ color: 'white', marginBottom: '2rem' }}>{page.title}</h1>
          {page.sections?.length > 0 ? (
            page.sections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <h3 style={{ color: '#00e5ff', marginTop: 0 }}>Tip secțiune: {section.block_type}</h3>
                <pre style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {JSON.stringify(section.payload, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8' }}>Această pagină nu are încă secțiuni adăugate.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title="Pagina inexistentă" description="Pagina căutată nu există." path="/404" noindex />
      <StatusPage code={404} />
    </>
  );
}
