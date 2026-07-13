import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { useReviews } from '../hooks/useReviews';
import ReviewCard from '../components/ui/ReviewCard';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { DarkCTA } from '../components/ui/SharedSections';
import './Recenzii.css';

export default function Recenzii() {
  const { data: reviews = [] } = useReviews();
  const ref = useRevealAll([reviews]);
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const displayAverage = reviews.length ? average.toFixed(1) : '—';
  const roundedAverage = reviews.length ? Math.max(1, Math.min(5, Math.round(average))) : 0;

  return (
    <div ref={ref}>
      <Seo title="Recenzii pacienti DentNow" description="Recenzii pacienti DentNow si link catre profilul Google pentru verificare." path="/recenzii" />
      <PageHero tag="Recenzii pacienti" title='Ce spun <em class="ac">pacientii.</em>' subtitle="Recenzii verificate, preluate din profilul Google al clinicilor DentNow." />
      <div className="rating-hero" data-nav-dark>
        <div className="big-rating rv">{displayAverage}</div>
        <div className="rating-stars rv d1" aria-label={`${displayAverage} din 5 stele`}>
          {'★'.repeat(roundedAverage)}{'☆'.repeat(5 - roundedAverage)}
        </div>
        <div className="rating-count rv d2">Rating mediu din recenzii Google verificate</div>
        <div className="rating-actions rv d3">
          <a href={config.verifiedReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-white">Verifica pe Google</a>
        </div>
      </div>
      <div className="reviews-grid">
        {reviews.map((r, i) => <ReviewCard key={r.id || r.author} review={r} className={`rv${i % 3 > 0 ? ` d${i % 3}` : ''}`} />)}
      </div>
      <DarkCTA title='Ai o experienta de impartasit?' subtitle="Recenziile verificate ajuta pacientii noi sa aleaga informat." />
    </div>
  );
}
