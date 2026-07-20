import { useEffect } from 'react';
import Seo from '../components/seo/Seo';
import { useSiteData } from '../public-site/SiteDataProvider';
import { siteLink, siteLinkHref } from '../lib/siteContent';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { isPreviewMode } from '../api/previewDraft';

export default function RecenzieRedirect() {
  const { links } = useSiteData();
  const t = useSiteTexts();
  const targetUrl = siteLinkHref(siteLink(links, 'review'));

  useEffect(() => {
    if (targetUrl && !isPreviewMode()) window.location.href = targetUrl;
  }, [targetUrl]);

  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
      <Seo path="/recenzie" noindex />
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: '2rem', marginBottom: '16px' }}>
        {t('recenzie.redirect.title')}
      </h1>
      <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
        {t('recenzie.redirect.text')}
      </p>
      {targetUrl && <a href={targetUrl} className="btn btn-dark" style={{ textDecoration: 'none' }}>
        {t('recenzie.redirect.button')} ➔
      </a>}
    </div>
  );
}
