/**
 * Loads the active publication's bootstrap from the public API and exposes it via
 * context. Loading, error, and empty states are EXPLICIT — the site never silently
 * renders stale/compiled clinic data when the API is unavailable.
 */
import { createContext, useContext, type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { fetchBootstrap, publicQueryKeys } from '../api/publicClient';
import type { Bootstrap } from '../api/publicContracts';
import { usePreviewDraft } from '../api/previewDraft';
import { StatusPage } from '../shared/StatusPage';

const SiteDataContext = createContext<Bootstrap | null>(null);

export function useSiteData(): Bootstrap {
  const value = useContext(SiteDataContext);
  if (!value) {
    throw new Error('useSiteData must be used within <SiteDataProvider>');
  }
  return value;
}

/** Like {@link useSiteData} but returns null outside the provider (e.g. isolated tests). */
export function useOptionalSiteData(): Bootstrap | null {
  return useContext(SiteDataContext);
}

function LoadingScreen() {
  return (
    <div
      role="status"
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        font: '15px/1.5 system-ui, sans-serif',
        color: '#334155',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <strong style={{ fontSize: '1.1rem' }}>Se încarcă conținutul…</strong>
      <span style={{ color: '#64748b', maxWidth: 420 }}>Preluăm informațiile clinicii.</span>
    </div>
  );
}

function BootstrapGate({ children }: { children: ReactNode }) {
  const clinicDraft = usePreviewDraft<Record<string, unknown>>('clinic');
  const doctorDraft = usePreviewDraft<Record<string, unknown>>('doctor');
  const serviceDraft = usePreviewDraft<Record<string, unknown>>('homepage-service');
  const galleryDraft = usePreviewDraft<Record<string, unknown>>('gallery-image');
  const quizDraft = usePreviewDraft<Record<string, unknown>>('quiz');
  const partnerDraft = usePreviewDraft<Record<string, unknown>>('partner');
  const technologyDraft = usePreviewDraft<Record<string, unknown>>('technology');
  const ebookDraft = usePreviewDraft<Record<string, unknown>>('ebook');
  const siteTextDraft = usePreviewDraft<{ key?: string; value?: string }>('site-text');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: publicQueryKeys.bootstrap,
    queryFn: fetchBootstrap,
    staleTime: 30_000,
    // retry policy comes from the QueryClient (retry:1 in the app, retry:false in tests)
  });

  if (isLoading) {
    return <LoadingScreen />;
  }
  if (isError || !data) {
    return (
      <StatusPage
        code={503}
        action={(
          <button type="button" className="btn btn-dark" onClick={() => void refetch()}>
            Reîncearcă
          </button>
        )}
      />
    );
  }

  const mergeItem = <T extends Record<string, unknown>>(
    items: T[],
    draft: Record<string, unknown> | null,
  ): T[] => {
    if (!draft) return items;
    const index = items.findIndex((item) =>
      (draft.id && item.id === draft.id) ||
      (draft.slug && item.slug === draft.slug),
    );
    if (index < 0) return [...items, draft as T];
    return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...draft } : item);
  };
  const mergePositionedItem = <T extends Record<string, unknown>>(
    items: T[],
    draft: Record<string, unknown> | null,
  ): T[] => {
    if (!draft) return items;
    const { __preview_position: originalPosition, ...publicDraft } = draft;
    if (typeof originalPosition === 'number') {
      const index = items.findIndex((item) => item.position === originalPosition);
      if (index >= 0) {
        return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...publicDraft } as T : item);
      }
    }
    return [publicDraft as T, ...items];
  };

  const previewData: Bootstrap = {
    ...data,
    clinics: mergeItem(data.clinics as unknown as Record<string, unknown>[], clinicDraft) as Bootstrap['clinics'],
    doctors: mergeItem(data.doctors as unknown as Record<string, unknown>[], doctorDraft) as Bootstrap['doctors'],
    homepage_services: mergePositionedItem(
      data.homepage_services as unknown as Record<string, unknown>[],
      serviceDraft,
    ) as Bootstrap['homepage_services'],
    gallery: mergePositionedItem(
      data.gallery as unknown as Record<string, unknown>[],
      galleryDraft,
    ) as Bootstrap['gallery'],
    partners: mergePositionedItem(
      data.partners as unknown as Record<string, unknown>[],
      partnerDraft,
    ) as Bootstrap['partners'],
    technologies: mergePositionedItem(
      data.technologies as unknown as Record<string, unknown>[],
      technologyDraft,
    ) as Bootstrap['technologies'],
    ebooks: mergePositionedItem(
      data.ebooks as unknown as Record<string, unknown>[],
      ebookDraft,
    ) as Bootstrap['ebooks'],
    quiz: quizDraft ? { ...data.quiz, ...quizDraft } as Bootstrap['quiz'] : data.quiz,
    texts: siteTextDraft?.key
      ? { ...data.texts, [siteTextDraft.key]: siteTextDraft.value ?? '' }
      : data.texts,
  };

  return <SiteDataContext.Provider value={previewData}>{children}</SiteDataContext.Provider>;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

export function SiteDataProvider({ children, client = queryClient }: { children: ReactNode; client?: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <BootstrapGate>{children}</BootstrapGate>
    </QueryClientProvider>
  );
}
