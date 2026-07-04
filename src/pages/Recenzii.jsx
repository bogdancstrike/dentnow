import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { reviews } from '../data/reviews';
import ReviewCard from '../components/ui/ReviewCard';
import PageHero from '../components/ui/PageHero';
import { DarkCTA } from '../components/ui/SharedSections';
import './Recenzii.css';

export default function Recenzii() {
  const ref = useRevealAll([]);
  return (
    <div ref={ref}>
      <PageHero tag="Recenzii Verificate" title='Ce spun <em class="ac">pacienții noștri.</em>' subtitle="Recenzii reale, verificate pe Google Maps și Facebook." />
      <div className="rating-hero" data-nav-dark>
        <div className="big-rating rv">4.8</div>
        <div className="rating-stars rv d1">★★★★★</div>
        <div className="rating-count rv d2">Bazat pe 200+ recenzii verificate Google</div>
        <div style={{ marginTop: 32 }}>
          <a href={config.maps.link} target="_blank" rel="noopener noreferrer" className="btn btn-white">📍 Lasă o recenzie pe Google</a>
        </div>
      </div>
      <div className="reviews-grid">
        {reviews.map((r, i) => <ReviewCard key={r.id} review={r} className={`rv${i % 3 > 0 ? ` d${i % 3}` : ''}`} />)}
      </div>
      <DarkCTA title='Ai o experiență de împărtășit?' subtitle="Recenziile tale ne ajută să ne îmbunătățim." />
    </div>
  );
}
