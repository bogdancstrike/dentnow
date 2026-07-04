const legalSections = [
  { title: '1. Informații generale', text: 'DentNow este o clinică stomatologică cu sediul în Str. Râmnicu Vâlcea nr. 29, Bloc 20D, Parter, Ap. 01, București, România. Suntem angajați să protejăm confidențialitatea și securitatea datelor dumneavoastră personale.' },
  { title: '2. Date colectate', text: 'Colectăm date personale necesare furnizării serviciilor medicale: nume, date de contact, date medicale, istoricul tratamentelor. Datele sunt colectate cu consimțământul dumneavoastră explicit.' },
  { title: '3. Drepturile dumneavoastră (GDPR)', list: ['Dreptul de acces la datele personale', 'Dreptul la rectificarea datelor incorecte', 'Dreptul la ștergerea datelor ("dreptul de a fi uitat")', 'Dreptul la restricționarea prelucrării', 'Dreptul la portabilitatea datelor', 'Dreptul de a depune o plângere la ANSPDCP'] },
  { title: '4. Securitatea datelor', text: 'Toate datele medicale sunt stocate securizat și accesate exclusiv de personalul medical autorizat. Nu partajăm datele cu terți fără consimțământul dumneavoastră, cu excepția obligațiilor legale.' },
  { title: '5. Contact', html: 'Pentru orice cerere legată de datele dumneavoastră: <a href="mailto:contact@dentnow.ro" style="color:var(--accent)">contact@dentnow.ro</a> sau <a href="tel:+40720509802" style="color:var(--accent)">0720 509 802</a>.' },
];

export default function LegalContent() {
  return (
    <>
      {legalSections.map((s, i) => (
        <div key={i}>
          <h2 style={{ fontFamily: 'var(--fd)', fontSize: 24, fontWeight: 700, color: 'var(--black)', margin: '40px 0 16px' }}>{s.title}</h2>
          {s.text && <p style={{ marginBottom: 16 }}>{s.text}</p>}
          {s.html && <p style={{ marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: s.html }} />}
          {s.list && <ul style={{ margin: '0 0 16px 24px' }}>{s.list.map((l, j) => <li key={j} style={{ marginBottom: 8 }}>{l}</li>)}</ul>}
        </div>
      ))}
    </>
  );
}
