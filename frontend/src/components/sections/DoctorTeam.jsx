import { useSiteData } from '../../public-site/SiteDataProvider';
import { mediaUrl } from '../../api/publicClient';
import './Sections.css';

const FALLBACK_PORTRAITS = [
  '/assets/dentnow/doctor-daria.svg',
  '/assets/dentnow/doctor-diana.svg',
  '/assets/dentnow/doctor-loredana.svg',
];

export default function DoctorTeam() {
  const { doctors } = useSiteData();
  if (!doctors || doctors.length === 0) return null;

  return (
    <section className="section-wrap" id="echipa">
      <div className="section-inner">
        <div className="section-kicker">Echipa</div>
        <h2 className="section-title">Medici prezentati clar, fara mister.</h2>
        <p className="section-lead">Profiluri scurte si verificabile — medicii care iti explica fiecare pas al tratamentului, inainte sa incepi.</p>
        <div className="doctor-grid">
          {doctors.map((doctor, index) => (
            <article className="doctor-card" key={doctor.slug || doctor.name}>
              <img
                src={doctor.portrait_media_id ? mediaUrl(doctor.portrait_media_id) : FALLBACK_PORTRAITS[index % FALLBACK_PORTRAITS.length]}
                alt={`Portret ${doctor.name}`}
                loading="lazy"
              />
              <div>
                <h3>{doctor.name}</h3>
                {doctor.role && <p className="doctor-role">{doctor.role}</p>}
                {doctor.focus && <p>{doctor.focus}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
