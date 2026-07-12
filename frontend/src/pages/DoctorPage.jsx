import { useParams, Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useSiteData } from '../public-site/SiteDataProvider';
import { mediaUrl } from '../api/publicClient';
import './DoctorPage.css';
import { isPreviewMode, usePreviewDraft } from '../api/previewDraft';
import NotFound from './NotFound';

const FALLBACK_PORTRAIT = '/assets/dentnow/team.svg';

export default function DoctorPage() {
  const { slug } = useParams();
  const { doctors } = useSiteData();
  const doctorDraft = usePreviewDraft('doctor');

  const index = doctors.findIndex((d) => d.slug === slug);
  const savedDoctor = index >= 0 ? doctors[index]
    : (doctorDraft?.id ? doctors.find((doctor) => doctor.id === doctorDraft.id) : null);
  const doctor = doctorDraft ? { ...(savedDoctor || {}), ...doctorDraft } : savedDoctor;
  if (!doctor) return isPreviewMode() ? null : <NotFound />;

  const image = doctor.portrait_media_id
    ? mediaUrl(doctor.portrait_media_id, 'hero')
    : FALLBACK_PORTRAIT;

  return (
    <div>
      <Seo
        title={`${doctor.name} — Echipa DentNow`}
        description={doctor.focus || `Medic DentNow: ${doctor.name}`}
        path={`/echipa/${doctor.slug}`}
      />
      <PageHero tag="Echipa medicală" title={doctor.name} subtitle={doctor.role || ''} />

      <section className="doctor-profile-sec">
        <div className="doctor-profile-grid">
          <div className="doctor-profile-photo">
            <img src={image} alt={`Portret ${doctor.name}`} />
          </div>
          <div className="doctor-profile-body">
            {doctor.role && <div className="doctor-profile-role">{doctor.role}</div>}
            {doctor.credentials && <p className="doctor-profile-cred">{doctor.credentials}</p>}
            {doctor.focus && <p className="doctor-profile-focus">{doctor.focus}</p>}
            <div className="doctor-profile-actions">
              <Link to="/#contact" className="btn btn-dark">Programează o consultație</Link>
              <Link to="/#echipa" className="btn btn-outline">Vezi toată echipa</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
