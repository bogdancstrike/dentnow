import Seo from '../components/seo/Seo';
import { StatusPage } from '../shared/StatusPage';

export default function NotFound() {
  return (
    <>
      <Seo title="Pagina inexistentă" description="Pagina căutată nu există." path="/404" noindex />
      <StatusPage code={404} />
    </>
  );
}
