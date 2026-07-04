import { useState } from 'react';
import { useRevealAll } from '../hooks/useReveal';
import { offers } from '../data/content';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import AppointmentPanel from '../components/sections/AppointmentPanel';
import './Oferte.css';

export default function Oferte() {
  const ref = useRevealAll([]);
  const [selected, setSelected] = useState('');
  return (
    <div ref={ref}>
      <Seo title="Oferte stomatologice DentNow" description="Oferte DentNow pentru consultatii, igienizare, implanturi si albire. Preturile se confirma inainte de tratament." path="/oferte" />
      <PageHero dark tag="Oferte DentNow" title='Pachete clare,<br><em class="ac">fara presiune falsa.</em>' subtitle="Ofertele sunt afisate cu pret de pornire si trebuie confirmate de clinica inainte de lansare." />
      <div className="offers-grid">
        {offers.map((o, i) => (
          <article key={o.name} className={`offer-card rv${i > 0 ? ` d${i % 3}` : ''}${o.featured ? ' featured' : ''}`}>
            <div className="offer-badge">{o.badge}</div>
            <span className="offer-icon">{o.icon}</span>
            <h3 className="offer-name">{o.name}</h3>
            <p className="offer-desc">{o.desc}</p>
            <div className="price-row"><span className="price-new">{o.price}</span><span className="price-old">{o.oldPrice}</span></div>
            <span className="price-save">Economisesti {o.save}</span>
            <div className="offer-features">{o.features.map((f) => <div key={f} className="of">{f}</div>)}</div>
            <a href="#oferta-programare" onClick={() => setSelected(o.name)} className="btn btn-dark offer-action">Cere programare</a>
          </article>
        ))}
      </div>
      <section id="oferta-programare" className="offer-appointment">
        <AppointmentPanel title="Cere detalii despre oferta" selectedService={selected || 'Consultatie'} source="oferte" />
        <p className="offer-note">Ultima actualizare continut: Iulie 2026. Valabilitatea ofertelor trebuie confirmata de clinica inainte de publicare.</p>
      </section>
    </div>
  );
}
