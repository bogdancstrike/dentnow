/**
 * Public site application.
 *
 * Task 2 keeps the existing route tree and page components intact (they still read
 * the compiled `src/config.js` fallbacks). Task 14 refactors these into pure
 * renderers driven only by the published backend snapshot and deletes the fallbacks.
 *
 * The browser router lives in `App.tsx`; this component owns the public providers,
 * the shared `Layout`, and the route table. Existing `.jsx` pages are imported under
 * `allowJs` and typed as `any` until they migrate.
 */
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../hooks/useToast';
import { ThemeProvider } from '../hooks/useTheme';
import { ClinicPickerProvider } from '../hooks/useClinicPicker';
import { SiteDataProvider } from './SiteDataProvider';
import Layout from '../components/layout/Layout';

import Home from '../pages/Home';
import Tratamente from '../pages/Tratamente';
import TreatmentDetail from '../pages/TreatmentDetail';
import Oferte from '../pages/Oferte';
import Articole from '../pages/Articole';
import Recenzii from '../pages/Recenzii';
import RecenzieRedirect from '../pages/RecenzieRedirect';
import BeforeAfter from '../pages/BeforeAfter';
import Noutati from '../pages/Noutati';
import ScorIgiena from '../pages/ScorIgiena';
import Parteneri from '../pages/Parteneri';
import Ebook from '../pages/Ebook';
import LocationPage from '../pages/LocationPage';
import UrgenteDentare from '../pages/UrgenteDentare';
import DecontatCas from '../pages/DecontatCas';
import GDPR from '../pages/GDPR';
import Confidentialitate from '../pages/Confidentialitate';
import Termeni from '../pages/Termeni';
import NotFound from '../pages/NotFound';

export default function PublicApp() {
  return (
    <SiteDataProvider>
      <ThemeProvider>
        <ToastProvider>
          <ClinicPickerProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="tratamente" element={<Tratamente />} />
              <Route path="oferte" element={<Oferte />} />
              <Route path="articole" element={<Articole />} />
              <Route path="articole/:slug" element={<Articole />} />
              <Route path="recenzii" element={<Recenzii />} />
              <Route path="recenzie" element={<RecenzieRedirect />} />
              <Route path="before-after" element={<BeforeAfter />} />
              <Route path="noutati" element={<Noutati />} />
              <Route path="scor-igiena" element={<ScorIgiena />} />
              <Route path="parteneri" element={<Parteneri />} />
              <Route path="ebook" element={<Ebook />} />

              {/* Neighborhood local-SEO routes */}
              <Route path="locatii/:citySlug" element={<LocationPage />} />
              <Route path="stomatologie-dristor" element={<LocationPage />} />
              <Route path="stomatologie-baba-novac" element={<LocationPage />} />
              <Route
                path="stomatologie-prelungirea-ghencea"
                element={<LocationPage />}
              />

              {/* Dedicated treatment pages */}
              <Route path="implant-dentar-bucuresti" element={<TreatmentDetail />} />
              <Route path="aparat-dentar-dristor" element={<TreatmentDetail />} />
              <Route path="albire-dentara-laser" element={<TreatmentDetail />} />
              <Route path="protetica-zirconiu" element={<TreatmentDetail />} />

              {/* Emergency & CAS pages */}
              <Route path="urgente-dentare-bucuresti" element={<UrgenteDentare />} />
              <Route path="decontat-cas" element={<DecontatCas />} />

              <Route path="gdpr" element={<GDPR />} />
              <Route path="confidentialitate" element={<Confidentialitate />} />
              <Route path="termeni" element={<Termeni />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </ClinicPickerProvider>
        </ToastProvider>
      </ThemeProvider>
    </SiteDataProvider>
  );
}
