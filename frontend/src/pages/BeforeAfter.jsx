import { useRevealAll } from '../hooks/useReveal';
import { useQuery } from '@tanstack/react-query';
import { fetchCaseStudies, mediaUrl, publicQueryKeys } from '../api/publicClient';
import { usePreviewDraft } from '../api/previewDraft';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { DarkCTA } from '../components/ui/SharedSections';
import './BeforeAfter.css';
import { StatusPage } from '../shared/StatusPage';
import { useSiteTexts } from '../hooks/useSiteTexts';

export default function BeforeAfter() {
  const t = useSiteTexts();
  const { data: savedCases = [], isError } = useQuery({
    queryKey: publicQueryKeys.caseStudies,
    queryFn: fetchCaseStudies,
  });
  const draft = usePreviewDraft('case-study');
  const casesWithDraft = draft
    ? (() => {
        const { __preview_position: originalPosition, ...publicDraft } = draft;
        const index = savedCases.findIndex((item) =>
          (publicDraft.id && item.id === publicDraft.id)
          || (typeof originalPosition === 'number' && item.position === originalPosition),
        );
        if (index < 0) return [publicDraft, ...savedCases];
        return savedCases.map((item, itemIndex) => itemIndex === index ? { ...item, ...publicDraft } : item);
      })()
    : savedCases;
  const cases = casesWithDraft;
  const ref = useRevealAll([cases]);
  if (isError) return <StatusPage code={503} />;
  return (
    <div ref={ref}>
      <Seo path="/before-after" />
      <PageHero dark tag={t('beforeafter.hero.tag')} title={t('beforeafter.hero.title')} subtitle={t('beforeafter.hero.subtitle')} />
      <div className="case-grid">
        {cases.map((c, i) => {
          const beforeImage = c.before_media_id ? mediaUrl(c.before_media_id, 'hero') : null;
          const afterImage = c.after_media_id ? mediaUrl(c.after_media_id, 'hero') : null;
          if (!beforeImage || !afterImage) return null;
          return (
          <article key={c.id || c.title} className={`case-card rv${i % 2 ? ' d1' : ''}`}>
            <div className="case-pair">
              <div className="case-shot"><img src={beforeImage} alt={`${c.title} înainte`} /><div className="case-label">ÎNAINTE</div></div>
              <div className="case-shot"><img src={afterImage} alt={`${c.title} după`} /><div className="case-label">DUPĂ</div></div>
            </div>
            <div className="case-body">
              <small>{c.treatment || t('beforeafter.case.fallback')}</small>
              <h3>{c.title}</h3>
              {c.description && <p>{c.description}</p>}
              {c.disclaimer && c.disclaimer !== c.description ? <p className="case-disclaimer">{c.disclaimer}</p> : null}
            </div>
          </article>
          );
        })}
      </div>
      <DarkCTA title={t('beforeafter.cta.title')} subtitle={t('beforeafter.cta.subtitle')} />
    </div>
  );
}
