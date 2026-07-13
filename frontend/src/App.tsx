/**
 * Top-level entry that selects the correct application by route:
 *
 *  - bare `/admin` and `/admin/*` lazy-load the admin bundle (keeps `keycloak-js` and
 *    Ant Design out of the eager public chunk);
 *  - every other path renders the public site.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicApp from './public-site/PublicApp';
import AppLoading from './shared/AppLoading';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
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
