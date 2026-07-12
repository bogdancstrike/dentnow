import DOMPurify from 'dompurify';
import type { TreatmentRow } from './TreatmentsScreen';

export interface TreatmentPreviewValues extends Partial<TreatmentRow> {}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownPreview(value: string): string {
  const blocks: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length > 0) {
      blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
      list = [];
    }
  };
  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('- ')) {
      list.push(line.slice(2));
      continue;
    }
    flushList();
    if (!line) continue;
    if (line.startsWith('### ')) blocks.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) blocks.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    else if (line.startsWith('# ')) blocks.push(`<h2>${inlineMarkdown(line.slice(2))}</h2>`);
    else if (line.startsWith('> ')) blocks.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    else blocks.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  flushList();
  return DOMPurify.sanitize(blocks.join(''));
}

function buildPreviewDocument(values: TreatmentPreviewValues): string {
  const hasContent = Boolean(values.name || values.summary || values.body_markdown);
  const name = escapeHtml(values.name || 'Nume Tratament');
  const summary = escapeHtml(values.summary || 'Sumarul tratamentului va apărea aici.');
  const body = markdownPreview(values.body_markdown || 'Conținutul detaliat va apărea aici.');

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name}</title>
  <style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff;color:#193a42;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .empty{display:grid;min-height:720px;place-items:center;color:#8b93a1;font-size:14px}
    .hero{background:#e9f7f8;padding:64px 42px 36px;text-align:center}
    .category{display:inline-flex;border-radius:999px;background:#0f7f8d;color:#fff;padding:6px 11px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    h1{margin:20px 0 14px;color:#102f37;font:700 clamp(28px,4vw,48px)/1.09 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.04em}
    .lead{max-width:650px;margin:0 auto;color:#637b82;font-size:17px;line-height:1.6}
    article{max-width:720px;margin:0 auto;padding:42px;color:#425f66;font-family:Georgia,"Times New Roman",serif;font-size:17px;line-height:1.85}
    article h2,article h3{margin:1.7em 0 .55em;color:#173b43;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.25}
    article h2{font-size:25px}article h3{font-size:20px}
    article p{margin:0 0 1.15em}
    article a{color:#0f7f8d}
    .btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;border-radius:8px;background:#0f7f8d;color:#fff;font-weight:600;text-decoration:none;margin-top:30px;font-family:Inter,sans-serif}
    @media(max-width:520px){.hero,article{padding:32px 20px}h1{font-size:31px}.lead{font-size:15px}}
  </style>
</head>
<body>
  ${hasContent ? `
  <header class="hero">
    <span class="category">Tratament DentNow</span>
    <h1>${name}</h1>
    <p class="lead">${summary}</p>
    <a href="#" class="btn">Programează-te</a>
  </header>
  <article>${body}</article>` : '<div class="empty">Începe să completezi informațiile pentru a vedea tratamentul.</div>'}
</body>
</html>`;
}

export function TreatmentLivePreview({
  values,
  viewport,
}: {
  values: TreatmentPreviewValues;
  viewport: 'desktop' | 'mobile';
}) {
  return (
    <div className={`article-preview-frame article-preview-frame--${viewport}`}>
      <div className="article-preview-browser" aria-hidden>
        <span /><span /><span />
        <div>dentnow.ro/tratamente/{values.slug || 'tratament-nou'}</div>
      </div>
      <iframe
        className="article-preview-iframe"
        title="Previzualizare live a tratamentului"
        sandbox=""
        srcDoc={buildPreviewDocument(values)}
      />
    </div>
  );
}
