import DOMPurify from 'dompurify';

export interface ArticlePreviewValues {
  title?: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  body_markdown?: string;
  author?: string;
  published_at?: string;
}

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

function formatDate(value?: string): string {
  if (!value) return 'Data publicării';
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function buildPreviewDocument(values: ArticlePreviewValues): string {
  const hasContent = Boolean(values.title || values.excerpt || values.body_markdown);
  const title = escapeHtml(values.title || 'Titlul articolului');
  const category = escapeHtml(values.category || 'Articole DentNow');
  const excerpt = escapeHtml(values.excerpt || 'Rezumatul articolului va apărea aici.');
  const author = escapeHtml(values.author || 'Echipa DentNow');
  const publishedAt = escapeHtml(formatDate(values.published_at));
  const body = markdownPreview(values.body_markdown || 'Conținutul articolului va apărea aici.');

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff;color:#193a42;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .empty{display:grid;min-height:720px;place-items:center;color:#8b93a1;font-size:14px}
    .hero{max-width:760px;margin:0 auto;padding:64px 42px 36px;text-align:center}
    .category{display:inline-flex;border-radius:999px;background:#e9f7f8;color:#0f7f8d;padding:6px 11px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    h1{margin:20px 0 14px;color:#102f37;font:700 clamp(28px,4vw,48px)/1.09 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.04em}
    .lead{max-width:650px;margin:0 auto;color:#637b82;font-size:17px;line-height:1.6}
    .byline{display:inline-flex;align-items:center;gap:10px;margin-top:26px;text-align:left}.avatar{display:grid;width:38px;height:38px;place-items:center;border-radius:50%;background:#143b44;color:#fff;font-size:11px;font-weight:700}.byline-copy{display:grid}.byline strong{font-size:12px}.byline small{color:#748990;font-size:10px}
    .cover{display:grid;min-height:260px;place-content:center;background:radial-gradient(circle at 25% 20%,rgba(34,211,238,.28),transparent 30%),linear-gradient(135deg,#0d3944 0%,#096f82 62%,#08a0ad 100%);color:#fff;text-align:center}.cover span{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.cover strong{margin-top:7px;font-size:25px;line-height:1.2}
    article{max-width:720px;margin:0 auto;padding:42px;color:#425f66;font-family:Georgia,"Times New Roman",serif;font-size:17px;line-height:1.85}article h2,article h3{margin:1.7em 0 .55em;color:#173b43;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.25}article h2{font-size:25px}article h3{font-size:20px}article p{margin:0 0 1.15em}article blockquote{margin:1.5em 0;border-left:4px solid #0f7f8d;background:#f1fafb;padding:14px 18px}article a{color:#0f7f8d}
    @media(max-width:520px){.hero,article{padding:32px 20px}.cover{min-height:210px}h1{font-size:31px}.lead{font-size:15px}}
  </style>
</head>
<body>
  ${hasContent ? `
  <header class="hero">
    <span class="category">${category}</span>
    <h1>${title}</h1>
    <p class="lead">${excerpt}</p>
    <div class="byline"><span class="avatar">DN</span><span class="byline-copy"><strong>${author}</strong><small>${publishedAt} · 4 min citire</small></span></div>
  </header>
  <div class="cover"><span>Ghid DentNow</span><strong>${category}</strong></div>
  <article>${body}</article>` : '<div class="empty">Începe să scrii pentru a vedea articolul.</div>'}
</body>
</html>`;
}

export function ArticleLivePreview({
  values,
  viewport,
}: {
  values: ArticlePreviewValues;
  viewport: 'desktop' | 'mobile';
}) {
  return (
    <div className={`article-preview-frame article-preview-frame--${viewport}`}>
      <div className="article-preview-browser" aria-hidden>
        <span /><span /><span />
        <div>dentnow.ro/articole/{values.slug || 'articol-nou'}</div>
      </div>
      <iframe
        className="article-preview-iframe"
        title="Previzualizare live a articolului"
        sandbox=""
        srcDoc={buildPreviewDocument(values)}
      />
    </div>
  );
}
