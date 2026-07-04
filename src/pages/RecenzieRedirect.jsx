import { useEffect } from 'react';
import config from '../config';
import Seo from '../components/seo/Seo';

export default function RecenzieRedirect() {
  const targetUrl = config.verifiedReviewsUrl;

  useEffect(() => {
    window.location.href = targetUrl;
  }, [targetUrl]);

  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
      <Seo title="Lasă o recenzie DentNow" description="Redirecționare către pagina oficială de recenzii DentNow pe Google Maps." path="/recenzie" />
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: '2rem', marginBottom: '16px' }}>
        Redirecționare către recenzii Google...
      </h1>
      <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
        Dacă nu sunteți redirecționat automat în câteva secunde, apăsați pe butonul de mai jos:
      </p>
      <a href={targetUrl} className="btn btn-dark" style={{ textDecoration: 'none' }}>
        Lasă o recenzie pe Google Maps ➔
      </a>
    </div>
  );
}
