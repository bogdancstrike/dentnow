import { doctors } from '../../data/clinicProof';
import './Sections.css';

export default function DoctorTeam() {
  return (
    <section className="section-wrap">
      <div className="section-inner">
        <div className="section-kicker">Echipa</div>
        <h2 className="section-title">Medici prezentati clar, fara mister.</h2>
        <p className="section-lead">Inlocuieste placeholder-ele cu fotografii si credentiale reale inainte de lansare. Sectiunea este pregatita pentru profiluri scurte si verificabile.</p>
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor.name}>
              <img src={doctor.image} alt={`Placeholder portret ${doctor.name}`} />
              <div>
                <h3>{doctor.name}</h3>
                <p className="doctor-role">{doctor.role}</p>
                <p>{doctor.focus}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
