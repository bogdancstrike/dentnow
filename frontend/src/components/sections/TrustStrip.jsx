import './Sections.css';

export default function TrustStrip({ items }) {
  return (
    <div className="trust-strip" aria-label="Motive de încredere">
      {items.map((item) => (
        <div className="trust-pill" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
