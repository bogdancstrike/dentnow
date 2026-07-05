import { LegalPage } from '../components/ui/SharedSections';
import Seo from '../components/seo/Seo';
import LegalContent from './LegalContent';

export default function Termeni() {
  return (
    <>
      <Seo
        title="Termeni și Condiții DentNow"
        description="Termeni și condiții pentru utilizarea website-ului DentNow, programări, informații medicale și oferte."
        path="/termeni"
      />
      <LegalPage title="Termeni și Condiții" date="Iulie 2026">
        <LegalContent type="terms" />
      </LegalPage>
    </>
  );
}
