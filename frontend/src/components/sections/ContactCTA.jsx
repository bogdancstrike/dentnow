import { useClinicPicker } from '../../hooks/useClinicPicker';
import { IconPhone, IconWhatsApp } from '../ui/Icons';
import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import { useOptionalSiteData } from '../../public-site/SiteDataProvider';

export default function ContactCTA({
  title,
  subtitle,
}) {
  const openPicker = useClinicPicker();
  const t = useSiteTexts();
  const siteName = useOptionalSiteData()?.site?.site_name || '';
  return (
    <aside className="contact-cta" aria-label={`Contact ${siteName}`.trim()}>
      <h2 className="contact-cta-title">{title || t('common.contact.title')}</h2>
      <p className="contact-cta-sub">{subtitle || t('common.contact.subtitle')}</p>
      <div className="contact-cta-actions">
        <button type="button" onClick={() => openPicker('call')} className="contact-cta-call"><IconPhone size={18} /> {t('common.contact.callButton')}</button>
        <button type="button" onClick={() => openPicker('whatsapp')} className="contact-cta-wa"><IconWhatsApp size={18} /> {t('common.contact.whatsappButton')}</button>
      </div>
    </aside>
  );
}
