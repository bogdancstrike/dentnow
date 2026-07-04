import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { ThemeProvider } from './hooks/useTheme';
import { ClinicPickerProvider } from './hooks/useClinicPicker';
import Layout from './components/layout/Layout';

import Home from './pages/Home';
import Tratamente from './pages/Tratamente';
import TreatmentDetail from './pages/TreatmentDetail';
import Oferte from './pages/Oferte';
import Articole from './pages/Articole';
import Recenzii from './pages/Recenzii';
import RecenzieRedirect from './pages/RecenzieRedirect';
import BeforeAfter from './pages/BeforeAfter';
import Noutati from './pages/Noutati';
import ScorIgiena from './pages/ScorIgiena';
import Parteneri from './pages/Parteneri';
import Ebook from './pages/Ebook';
import LocationPage from './pages/LocationPage';
import UrgenteDentare from './pages/UrgenteDentare';
import DecontatCas from './pages/DecontatCas';
import GDPR from './pages/GDPR';
import Confidentialitate from './pages/Confidentialitate';
import Termeni from './pages/Termeni';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
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
              
              {/* Neighborhood Local SEO Routes */}
              <Route path="locatii/:citySlug" element={<LocationPage />} />
              <Route path="stomatologie-dristor" element={<LocationPage />} />
              <Route path="stomatologie-baba-novac" element={<LocationPage />} />
              <Route path="stomatologie-prelungirea-ghencea" element={<LocationPage />} />

              {/* Dedicated Treatment Pages */}
              <Route path="implant-dentar-bucuresti" element={<TreatmentDetail />} />
              <Route path="aparat-dentar-dristor" element={<TreatmentDetail />} />
              <Route path="albire-dentara-laser" element={<TreatmentDetail />} />
              <Route path="protetica-zirconiu" element={<TreatmentDetail />} />

              {/* Emergency & CAS Pages */}
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
    </BrowserRouter>
  );
}
