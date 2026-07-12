import { AdminApiError } from '../api/adminClient';
import { StatusPage } from '../../shared/StatusPage';

export function AdminRequestError({ error }: { error: unknown }) {
  const status = error instanceof AdminApiError ? error.status : 503;
  if (status === 403) return <StatusPage code={403} />;
  if (status === 404) return <StatusPage code={404} />;
  return <StatusPage code={503} />;
}
