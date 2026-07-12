import type { ReactNode } from 'react';
import './statusPage.css';

interface StatusPageProps {
  code: 403 | 404 | 503;
  title?: string;
  detail?: string;
  action?: ReactNode;
}

const COPY = {
  403: {
    eyebrow: 'Acces restricționat',
    title: 'Nu ai acces la această secțiune.',
    detail: 'Contul autentificat nu are permisiunea necesară. Poți reveni la o secțiune disponibilă sau te poți conecta cu alt cont.',
  },
  404: {
    eyebrow: 'Pagină inexistentă',
    title: 'Nu am găsit resursa căutată.',
    detail: 'Este posibil ca adresa să fie greșită, iar conținutul să fi fost mutat sau eliminat.',
  },
  503: {
    eyebrow: 'Mentenanță temporară',
    title: 'Serviciul nu este disponibil momentan.',
    detail: 'Nu putem contacta platforma DentNow. Datele nu sunt înlocuite cu informații vechi; încearcă din nou peste câteva momente.',
  },
} as const;

export function StatusPage({ code, title, detail, action }: StatusPageProps) {
  const copy = COPY[code];
  return (
    <main className="status-page" role={code === 503 ? 'status' : undefined}>
      <div className="status-page-card">
        <div className="status-page-code" aria-hidden>{code}</div>
        <div className="status-page-copy">
          <span className="status-page-eyebrow">{copy.eyebrow}</span>
          <h1>{title || copy.title}</h1>
          <p>{detail || copy.detail}</p>
          <div className="status-page-actions">
            {action || <a className="btn btn-dark" href="/">Înapoi la pagina principală</a>}
          </div>
        </div>
      </div>
    </main>
  );
}
