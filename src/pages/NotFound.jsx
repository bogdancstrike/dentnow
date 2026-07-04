import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';

export default function NotFound() {
  return (
    <section className="page-hero">
      <Seo title="Pagina inexistenta" description="Pagina cautata nu exista pe website-ul DentNow." path="/404" noindex />
      <div className="stag">404</div>
      <h1 className="h2d" style={{ margin: '16px 0' }}>Pagina nu a fost gasita.</h1>
      <p className="lead" style={{ margin: '0 auto 28px', maxWidth: 520 }}>Verifica adresa sau intoarce-te la pagina principala DentNow.</p>
      <Link to="/" className="btn btn-dark">Inapoi acasa</Link>
    </section>
  );
}
