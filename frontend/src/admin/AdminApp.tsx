/**
 * Administration application — lazy-loaded ONLY for bare `/admin` and `/admin/*`.
 *
 * Flow: require admin runtime config → Keycloak login-required (PKCE S256) → load
 * `/api/v1/admin/me` → render the shell (or an access-denied page for a principal with
 * no DentNow role). One Ant Design ConfigProvider + App wraps the whole shell.
 */
import { useEffect, useState } from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { MissingAdminConfigError, requireAdminConfig } from '../config/runtime';
import { AdminClient, UnauthorizedError } from './api/adminClient';
import { getAdminToken, initKeycloak } from './auth/keycloak';
import { MeSchema, type Me } from './auth/permissions';
import { adminTheme } from './theme';
import { AdminLayout } from './layout/AdminLayout';
import { AccessDeniedPage } from './pages/AccessDeniedPage';

type State =
  | { phase: 'init' }
  | { phase: 'config-error'; message: string }
  | { phase: 'denied' }
  | { phase: 'ready'; me: Me; client: AdminClient }
  | { phase: 'error'; message: string };

export default function AdminApp() {
  const [state, setState] = useState<State>({ phase: 'init' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        requireAdminConfig();
      } catch (err) {
        const message =
          err instanceof MissingAdminConfigError
            ? err.message
            : 'admin configuration invalid';
        if (!cancelled) setState({ phase: 'config-error', message });
        return;
      }
      try {
        await initKeycloak();
        const client = new AdminClient(getAdminToken);
        const { data } = await client.get('/v1/admin/me');
        if (!cancelled) setState({ phase: 'ready', me: MeSchema.parse(data), client });
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          if (!cancelled) setState({ phase: 'denied' });
        } else if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 403) {
          if (!cancelled) setState({ phase: 'denied' });
        } else {
          if (!cancelled) setState({ phase: 'error', message: (err as Error).message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConfigProvider theme={adminTheme}>
      <AntApp>
        {state.phase === 'init' && (
          <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" tip="Se conectează la administrare…" />
          </div>
        )}
        {state.phase === 'config-error' && <AccessDeniedPage title="Configurare indisponibilă" detail={state.message} />}
        {state.phase === 'denied' && (
          <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu are un rol DentNow atribuit." />
        )}
        {state.phase === 'error' && <AccessDeniedPage title="Eroare" detail={state.message} />}
        {state.phase === 'ready' && <AdminLayout me={state.me} client={state.client} />}
      </AntApp>
    </ConfigProvider>
  );
}
