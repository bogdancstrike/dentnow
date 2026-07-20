import { useQuery } from '@tanstack/react-query';
import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';
import { fetchPageByPath, publicQueryKeys } from '../../api/publicClient';

export default function PatientJourney() {
  const t = useSiteTexts();
  const { data: page } = useQuery({
    queryKey: publicQueryKeys.page('/'),
    queryFn: () => fetchPageByPath('/'),
  });
  const journeySection = page?.sections?.find((section) => section.block_type === 'patient_journey');
  const patientJourney = Array.isArray(journeySection?.payload?.items)
    ? journeySection.payload.items
    : [];
  if (!patientJourney.length) return null;
  return (
    <section className="section-wrap">
      <div className="section-inner">
        <div className="section-kicker">{t('home.journey.tag')}</div>
        <h2 className="section-title">{t('home.journey.title')}</h2>
        <div className="journey-grid">
          {patientJourney.map((item) => (
            <article className="journey-card" key={item.step}>
              <div className="journey-step">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
