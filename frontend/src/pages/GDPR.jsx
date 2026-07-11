import { LegalPage } from '../components/ui/SharedSections';
import Seo from '../components/seo/Seo';
import LegalContent from './LegalContent';

export default function GDPR() {
  return (
    <>
      <Seo
        title="GDPR DentNow"
        description="Informații generale despre prelucrarea datelor personale prin website-ul și canalele de contact DentNow."
        path="/gdpr"
      />
      <LegalPage title="GDPR" date="Iulie 2026">
        <LegalContent type="gdpr" />
      </LegalPage>
    </>
  );
}
