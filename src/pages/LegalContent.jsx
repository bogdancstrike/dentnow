import config from '../config';

const content = {
  gdpr: [
    { title: '1. Operatorul datelor', text: 'DentNow prelucreaza date personale pentru gestionarea solicitarilor, programarilor si serviciilor stomatologice. Identitatea juridica exacta a operatorului trebuie completata de clinica inainte de lansare.' },
    { title: '2. Categorii de date', text: 'Putem colecta nume, telefon, email, mesajul transmis, preferinta de programare si informatii medicale oferite voluntar in formular sau conversatie.' },
    { title: '3. Temei si scop', text: 'Datele sunt folosite pentru a raspunde solicitarilor, pentru programari si pentru furnizarea serviciilor medicale. Datele medicale se trateaza cu confidentialitate sporita.' },
    { title: '4. Drepturi GDPR', list: ['Dreptul de acces', 'Dreptul la rectificare', 'Dreptul la stergere unde legea permite', 'Dreptul la restrictionare', 'Dreptul la opozitie', 'Dreptul de a depune plangere la ANSPDCP'] },
    { title: '5. Contact', text: `Pentru solicitari legate de date personale: ${config.email} sau ${config.phoneDisplay}.` },
  ],
  privacy: [
    { title: '1. Ce colectam pe website', text: 'Website-ul poate colecta date trimise prin formulare, date tehnice de navigare si eventual date de analytics daca aceste integrari sunt activate.' },
    { title: '2. Formulare si WhatsApp', text: 'Daca nu exista endpoint de lead configurat, solicitarile sunt trimise prin WhatsApp cu mesaj precompletat. Nu afisam confirmare de trimitere fara o actiune reala.' },
    { title: '3. Cookie-uri', text: 'Cookie-urile de marketing sau analytics trebuie documentate aici dupa configurarea finala. Pana atunci, evita activarea scripturilor fara consimtamant.' },
    { title: '4. Retentie', text: 'Durata de pastrare trebuie stabilita de clinica in functie de obligatiile medicale, fiscale si administrative.' },
    { title: '5. Contact', text: `Pentru intrebari: ${config.email}.` },
  ],
  terms: [
    { title: '1. Informatii generale', text: 'Website-ul DentNow are rol informativ si de prezentare. Informatiile nu inlocuiesc consultul stomatologic.' },
    { title: '2. Preturi si oferte', text: 'Preturile sunt informative si pot depinde de diagnostic, materiale si complexitatea cazului. Devizul final se confirma in clinica.' },
    { title: '3. Programari', text: 'Trimiterea unei solicitari nu garanteaza automat programarea. Clinica va confirma telefonic, prin email sau WhatsApp.' },
    { title: '4. Continut medical', text: 'Articolele si testul de igiena au scop educativ. Pentru diagnostic si tratament este necesara evaluarea unui medic.' },
    { title: '5. Limitare', text: 'DentNow poate actualiza continutul, programul, preturile si conditiile afisate pe website.' },
  ],
};

export default function LegalContent({ type = 'gdpr' }) {
  return (
    <>
      {(content[type] || content.gdpr).map((s) => (
        <section key={s.title} className="legal-section">
          <h2>{s.title}</h2>
          {s.text && <p>{s.text}</p>}
          {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
        </section>
      ))}
    </>
  );
}
