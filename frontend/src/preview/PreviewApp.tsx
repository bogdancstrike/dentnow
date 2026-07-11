/**
 * Isolated preview application — served on a distinct origin (`previewAppUrl`).
 *
 * Task 2 placeholder. It NEVER initializes Keycloak. Task 19 implements the one-use
 * fragment-token exchange for a short-lived HttpOnly preview session and renders the
 * same public components against the frozen snapshot contract.
 */
export default function PreviewApp() {
  return (
    <main style={{ padding: '3rem', font: '15px/1.5 system-ui, sans-serif' }}>
      <h1>DentNow Preview</h1>
      <p>Isolated preview renderer is added in Task 19.</p>
    </main>
  );
}
