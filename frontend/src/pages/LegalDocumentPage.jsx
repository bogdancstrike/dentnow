import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { fetchLegalDocument, publicQueryKeys } from '../api/publicClient';
import { usePreviewDraft } from '../api/previewDraft';
import { LegalPage } from '../components/ui/SharedSections';
import Seo from '../components/seo/Seo';
import NotFound from './NotFound';
import { StatusPage } from '../shared/StatusPage';

export default function LegalDocumentPage({ docType, title, seoTitle, description, path }) {
  const draft = usePreviewDraft('legal-document');
  const draftMatches = draft?.doc_type === docType;
  const query = useQuery({
    queryKey: publicQueryKeys.legalDocument(docType),
    queryFn: () => fetchLegalDocument(docType),
    enabled: !draftMatches,
    retry: false,
  });
  const document = draftMatches ? draft : query.data;

  if (!draftMatches && query.isLoading) {
    return <div className="news-detail-loading">Se încarcă documentul…</div>;
  }
  if (query.isError && query.error instanceof ApiError && query.error.status !== 404) {
    return <StatusPage code={503} />;
  }
  if (!document) return <NotFound />;

  const effectiveDate = document.effective_date
    ? new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(document.effective_date))
    : document.version_label;

  return (
    <>
      <Seo title={seoTitle} description={description} path={path} />
      <LegalPage title={title} date={effectiveDate}>
        <section className="legal-section" dangerouslySetInnerHTML={{ __html: document.body_html || '' }} />
      </LegalPage>
    </>
  );
}
