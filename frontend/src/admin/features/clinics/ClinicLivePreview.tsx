import DOMPurify from 'dompurify';
import type { ClinicRow } from './ClinicsScreen';

export interface ClinicPreviewValues extends Partial<ClinicRow> {
  // we can mock faqs or contacts if we want, but for now just scalar values
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildPreviewDocument(values: ClinicPreviewValues): string {
  const name = escapeHtml(values.name || 'Nume Clinică');
  const area = escapeHtml(values.area || 'Zona');
  const address = escapeHtml(values.address_full || 'Adresa completă...');
  
  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name}</title>
  <style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#f4f7f8;color:#193a42;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .hero{background:radial-gradient(circle at 25% 20%,rgba(34,211,238,.28),transparent 30%),linear-gradient(135deg,#0d3944 0%,#096f82 62%,#08a0ad 100%);color:#fff;padding:80px 42px;text-align:center}
    .category{display:inline-flex;border-radius:999px;background:#e9f7f8;color:#0f7f8d;padding:6px 11px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    h1{margin:20px 0 14px;color:#fff;font:700 clamp(28px,4vw,48px)/1.09 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.04em}
    .content{max-width:760px;margin: -30px auto 0;background:#fff;border-radius:12px;padding:42px;box-shadow:0 10px 30px rgba(0,0,0,.05)}
    .info-box{display:flex;flex-direction:column;gap:12px;margin-top:20px}
    .info-item{display:flex;align-items:flex-start;gap:12px;color:#425f66}
    .btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;border-radius:8px;background:#0f7f8d;color:#fff;font-weight:600;text-decoration:none;margin-top:30px}
  </style>
</head>
<body>
  <header class="hero">
    <span class="category">DentNow ${area}</span>
    <h1>${name}</h1>
  </header>
  <main class="content">
    <h2>Informații Clinică</h2>
    <div class="info-box">
      <div class="info-item">
        <strong>📍 Adresă:</strong>
        <span>${address}</span>
      </div>
      <div class="info-item">
        <strong>🕒 Status:</strong>
        <span>${values.status === 'active' ? 'Deschis' : values.status === 'closed' ? 'Închis' : 'În curând'}</span>
      </div>
    </div>
    <a href="#" class="btn">Programează-te acum</a>
  </main>
</body>
</html>`;
}

export function ClinicLivePreview({
  values,
  viewport,
}: {
  values: ClinicPreviewValues;
  viewport: 'desktop' | 'mobile';
}) {
  return (
    <div className={`clinic-preview-frame clinic-preview-frame--${viewport}`}>
      <div className="clinic-preview-browser" aria-hidden>
        <span /><span /><span />
        <div>dentnow.ro/locatii/{values.slug || 'clinica-noua'}</div>
      </div>
      <iframe
        className="clinic-preview-iframe"
        title="Previzualizare live a clinicii"
        sandbox=""
        srcDoc={buildPreviewDocument(values)}
      />
    </div>
  );
}
