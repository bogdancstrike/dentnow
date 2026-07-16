import { Link } from 'react-router-dom';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { mediaUrl } from '../../api/publicClient';
import './Sections.css';
import { useSiteTexts } from '../../hooks/useSiteTexts';

const FALLBACK_PORTRAIT = '/assets/dentnow/team.svg';

export default function DoctorTeam() {
  const t = useSiteTexts();
  const { doctors } = useSiteData();
  const useCarousel = doctors && doctors.length >= 4;

  if (!doctors || doctors.length === 0) return null;

  const renderCards = (duplicate = false) => doctors.map((doctor) => (
    <Link
      to={doctor.slug ? `/echipa/${doctor.slug}` : '#'}
      className="doctor-card"
      key={`${duplicate ? 'duplicate-' : ''}${doctor.slug || doctor.name}`}
      tabIndex={duplicate ? -1 : undefined}
    >
      <img
        src={doctor.portrait_media_id ? mediaUrl(doctor.portrait_media_id) : FALLBACK_PORTRAIT}
        alt={`Portret ${doctor.name}`}
        loading="lazy"
      />
      <div>
        <h3>{doctor.name}</h3>
        {doctor.role && <p className="doctor-role">{doctor.role}</p>}
        {doctor.focus && <p>{doctor.focus}</p>}
      </div>
    </Link>
  ));
  const cards = renderCards();

  return (
    <section className="section-wrap" id="echipa">
      <div className="section-inner">
        <div className="section-kicker">{t('home.team.tag')}</div>
        <h2 className="section-title">{t('home.team.title')}</h2>
        <p className="section-lead">{t('home.team.lead')}</p>
        {useCarousel ? (
          <div className="doctor-carousel">
            <div className="doctor-carousel-viewport" aria-label="Echipa medicală, carusel orizontal">
              <div
                className="doctor-carousel-marquee"
                style={{ '--doctor-carousel-duration': `${Math.max(24, doctors.length * 6)}s` }}
              >
                <div className="doctor-carousel-group">{cards}</div>
                <div className="doctor-carousel-group" aria-hidden="true">{renderCards(true)}</div>
              </div>
            </div>
          </div>
        ) : <div className="doctor-grid">{cards}</div>}
      </div>
    </section>
  );
}
