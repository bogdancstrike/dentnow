import { LegalPage } from '../components/ui/SharedSections';
import Seo from '../components/seo/Seo';
import LegalContent from './LegalContent';
export default function GDPR() {
  return <><Seo title="GDPR DentNow" description="Informatii GDPR pentru website-ul DentNow." path="/gdpr" /><LegalPage title="GDPR" date="Iulie 2026"><LegalContent type="gdpr" /></LegalPage></>;
}
