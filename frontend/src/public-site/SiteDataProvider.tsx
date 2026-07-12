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

const SiteDataContext = createContext<Bootstrap | null>(null);

export function useSiteData(): Bootstrap {
  const value = useContext(SiteDataContext);
  if (!value) {
    throw new Error('useSiteData must be used within <SiteDataProvider>');
  }
  return value;
}

function StatusScreen({ title, detail, onRetry }: { title: string; detail: string; onRetry?: () => void }) {
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
      <strong style={{ fontSize: '1.1rem' }}>{title}</strong>
      <span style={{ color: '#64748b', maxWidth: 420 }}>{detail}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Reîncearcă
        </button>
      )}
    </div>
  );
}

function BootstrapGate({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: publicQueryKeys.bootstrap,
    queryFn: fetchBootstrap,
    staleTime: 30_000,
    // retry policy comes from the QueryClient (retry:1 in the app, retry:false in tests)
  });

  if (isLoading) {
    return <StatusScreen title="Se încarcă conținutul…" detail="Preluăm informațiile clinicii." />;
  }
  if (isError || !data) {
    return (
      <StatusScreen
        title="Conținut indisponibil temporar"
        detail="Nu am putut încărca informațiile de la server. Vă rugăm reîncercați."
        onRetry={() => void refetch()}
      />
    );
  }
  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
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
