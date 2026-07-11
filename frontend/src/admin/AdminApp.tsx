/**
 * Administration application — lazy-loaded ONLY for bare `/admin` and `/admin/*`.
 *
 * Task 2 placeholder. Keeping `keycloak-js` and Ant Design out of this module for now
 * guarantees they stay out of the eager public bundle. Task 15 replaces this with the
 * real Keycloak-authenticated shell (PKCE, in-memory tokens, `/admin/me` gating).
 */
import { requireAdminConfig, MissingAdminConfigError } from '../config/runtime';

export default function AdminApp() {
  let error: string | null = null;
  try {
    requireAdminConfig();
  } catch (err) {
    error =
      err instanceof MissingAdminConfigError
        ? `Administration is unavailable: ${err.message}.`
        : 'Administration configuration could not be validated.';
  }

  return (
    <main style={{ padding: '3rem', font: '15px/1.5 system-ui, sans-serif' }}>
      <h1>DentNow Administration</h1>
      {error ? (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : (
        <p>Authentication shell is added in Task 15.</p>
      )}
    </main>
  );
}
