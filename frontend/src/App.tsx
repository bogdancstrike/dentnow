/**
 * Top-level entry that selects the correct application by route and origin:
 *
 *  - the isolated preview origin (`previewAppUrl`) renders the preview app and never
 *    touches Keycloak or the public router;
 *  - bare `/admin` and `/admin/*` lazy-load the admin bundle (keeps `keycloak-js` and
 *    Ant Design out of the eager public chunk);
 *  - every other path renders the public site.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicApp from './public-site/PublicApp';
import AppLoading from './shared/AppLoading';
import { getRuntimeConfig } from './config/runtime';

const AdminApp = lazy(() => import('./admin/AdminApp'));
const PreviewApp = lazy(() => import('./preview/PreviewApp'));

function isPreviewOrigin(): boolean {
  try {
    const { previewAppUrl } = getRuntimeConfig();
    return (
      typeof window !== 'undefined' &&
      previewAppUrl !== undefined &&
      window.location.origin === previewAppUrl
    );
  } catch {
    return false;
  }
}

export default function App() {
  if (isPreviewOrigin()) {
    return (
      <Suspense fallback={<AppLoading />}>
        <PreviewApp />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Hidden admin entry: /login is the only user-facing way in (no link on the
            public site). It redirects into the admin app, which requires Keycloak. */}
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AppLoading />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  );
}
