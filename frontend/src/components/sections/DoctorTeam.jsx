import { doctors } from '../../data/clinicProof';
import './Sections.css';

export default function DoctorTeam() {
  return (
    <section className="section-wrap" id="echipa">
      <div className="section-inner">
        <div className="section-kicker">Echipa</div>
        <h2 className="section-title">Medici prezentati clar, fara mister.</h2>
        <p className="section-lead">Profiluri scurte si verificabile — medicii care iti explica fiecare pas al tratamentului, inainte sa incepi.</p>
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
