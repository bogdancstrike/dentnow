import { useParams, Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import PageHero from '../components/ui/PageHero';
import { useSiteData } from '../public-site/SiteDataProvider';
import { mediaUrl } from '../api/publicClient';
import './DoctorPage.css';
import { isPreviewMode, usePreviewDraft } from '../api/previewDraft';
import NotFound from './NotFound';

export default function DoctorPage() {
  const { slug } = useParams();
  const { doctors, site } = useSiteData();
  const doctorDraft = usePreviewDraft('doctor');

  const index = doctors.findIndex((d) => d.slug === slug);
  const savedDoctor = index >= 0 ? doctors[index]
    : (doctorDraft?.id ? doctors.find((doctor) => doctor.id === doctorDraft.id) : null);
  const doctor = doctorDraft ? { ...(savedDoctor || {}), ...doctorDraft } : savedDoctor;
  if (!doctor) return isPreviewMode() ? null : <NotFound />;
  const siteName = site?.site_name || '';

  const image = doctor.portrait_media_id ? mediaUrl(doctor.portrait_media_id, 'hero') : null;
  const supportingPhotos = [doctor.workspace_media_id, doctor.secondary_media_id]
    .filter(Boolean)
    .map((mediaId) => mediaUrl(mediaId, 'hero'));
  const credentials = (doctor.credentials || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div>
      <Seo
        title={`${doctor.name} — ${siteName}`}
        description={doctor.focus || `${doctor.name}, ${siteName}`}
        path={`/echipa/${doctor.slug}`}
      />
      <PageHero tag="Echipa medicală" title={doctor.name} subtitle={doctor.role || ''} />

      <main className="doctor-profile-sec">
        <section className="doctor-profile-intro" aria-labelledby="doctor-profile-name">
          {image && <div className="doctor-profile-photo">
            <img src={image} alt={`Portret ${doctor.name}`} />
            <span>{siteName}</span>
          </div>}
          <div className="doctor-profile-body">
            {doctor.role && <div className="doctor-profile-role">{doctor.role}</div>}
            <h2 id="doctor-profile-name">{doctor.name}</h2>
            {doctor.focus && <p className="doctor-profile-focus">{doctor.focus}</p>}
            {credentials.length > 0 && (
              <div className="doctor-profile-credentials" aria-label="Acreditări și competențe">
                <span>Pregătire profesională</span>
                <ul>{credentials.map((credential) => <li key={credential}>{credential}</li>)}</ul>
              </div>
            )}
            <div className="doctor-profile-actions">
              <Link to="/#contact" className="btn btn-dark">Programează o consultație</Link>
              <Link to="/#echipa" className="btn btn-outline">Vezi toată echipa</Link>
            </div>
          </div>
        </section>

        {(doctor.description || doctor.approach) && (
          <section className="doctor-profile-story">
            {doctor.description && (
              <div className="doctor-profile-copy">
                <span className="doctor-profile-kicker">Despre medic</span>
                <h2>Îngrijire explicată clar, pas cu pas.</h2>
                {doctor.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            )}
            {doctor.approach && (
              <blockquote>
                <span aria-hidden>“</span>
                <p>{doctor.approach}</p>
                <cite>{doctor.name}</cite>
              </blockquote>
            )}
          </section>
        )}

        {supportingPhotos.length > 0 && (
          <section className={`doctor-profile-gallery doctor-profile-gallery--${supportingPhotos.length}`} aria-label={`Fotografii ${doctor.name}`}>
            {supportingPhotos.map((photo, photoIndex) => (
              <figure key={photo}>
                <img src={photo} alt={`${doctor.name} — ${photoIndex === 0 ? 'în cabinet' : 'fotografie profesională'}`} loading="lazy" />
              </figure>
            ))}
          </section>
        )}

        <section className="doctor-profile-appointment">
          <div>
            <span className="doctor-profile-kicker">Următorul pas</span>
            <h2>Hai să discutăm despre planul tău de tratament.</h2>
            <p>Consultația înseamnă evaluare, opțiuni explicate și un deviz clar înainte de intervenție.</p>
          </div>
          <Link to="/#contact" className="btn btn-dark">Alege clinica</Link>
        </section>
      </main>
    </div>
  );
}
