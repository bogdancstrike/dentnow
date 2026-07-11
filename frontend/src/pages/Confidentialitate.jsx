import { LegalPage } from '../components/ui/SharedSections';
import Seo from '../components/seo/Seo';
import LegalContent from './LegalContent';

export default function Confidentialitate() {
  return (
    <>
      <Seo
        title="Politica de Confidențialitate DentNow"
        description="Politica de confidențialitate pentru website-ul DentNow, formulare, programări și canale de contact."
        path="/confidentialitate"
      />
      <LegalPage title="Politica de Confidențialitate" date="Iulie 2026">
        <LegalContent type="privacy" />
      </LegalPage>
    </>
  );
}
