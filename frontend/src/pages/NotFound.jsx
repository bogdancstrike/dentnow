import Seo from '../components/seo/Seo';
import { StatusPage } from '../shared/StatusPage';

export default function NotFound() {
  return (
    <>
      <Seo title="Pagina inexistenta" description="Pagina cautata nu exista pe website-ul DentNow." path="/404" noindex />
      <StatusPage code={404} />
    </>
  );
}
