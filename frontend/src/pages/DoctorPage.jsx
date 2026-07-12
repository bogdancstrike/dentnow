import { useParams, Navigate, Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useSiteData } from '../public-site/SiteDataProvider';
import { mediaUrl } from '../api/publicClient';
import './DoctorPage.css';

const FALLBACK_PORTRAITS = [
  '/assets/dentnow/doctor-daria.svg',
  '/assets/dentnow/doctor-diana.svg',
  '/assets/dentnow/doctor-loredana.svg',
];

export default function DoctorPage() {
  const { slug } = useParams();
  const { doctors } = useSiteData();

  const index = doctors.findIndex((d) => d.slug === slug);
  const doctor = index >= 0 ? doctors[index] : null;
  if (!doctor) return <Navigate to="/#echipa" replace />;

  const image = doctor.portrait_media_id
    ? mediaUrl(doctor.portrait_media_id, 'hero')
    : FALLBACK_PORTRAITS[index % FALLBACK_PORTRAITS.length];

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
