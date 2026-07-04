import './PlaceholderCover.css';

// Self-contained placeholder cover — inline gradient + wordmark, no external
// asset, so it can never 404 or go missing in a stale build. Color varies per
// item so every article / e-book gets a distinct, recognizable cover.
const palettes = [
  ['#0f766e', '#134e4a'],
  ['#1d4ed8', '#1e3a8a'],
  ['#9333ea', '#581c87'],
  ['#ea580c', '#7c2d12'],
  ['#0891b2', '#155e75'],
  ['#15803d', '#14532d'],
  ['#be123c', '#7f1d34'],
];

function pick(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

export default function PlaceholderCover({ label = '', tag, brand = 'DentNow', className = '' }) {
  const [c1, c2] = pick(label || tag || brand);
  return (
    <div
      className={`ph-cover ${className}`}
      role="img"
      aria-label={`Imagine DentNow${tag ? ` — ${tag}` : ''}${label ? `: ${label}` : ''}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <span className="ph-watermark" aria-hidden="true">Dn</span>
      <span className="ph-brand">{brand}</span>
      {tag && <span className="ph-tag">{tag}</span>}
    </div>
  );
}
