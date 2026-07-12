import { useRevealAll } from '../hooks/useReveal';
import config from '../config';
import { useQuery } from '@tanstack/react-query';
import { fetchReviews, publicQueryKeys } from '../api/publicClient';
import ReviewCard from '../components/ui/ReviewCard';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/seo/Seo';
import { DarkCTA } from '../components/ui/SharedSections';

export default function Recenzii() {
  const ref = useRevealAll([]);
  const { data: reviews = [] } = useQuery({
    queryKey: publicQueryKeys.reviews,
    queryFn: fetchReviews,
  });

  return (
    <div ref={ref}>
      <Seo title="Recenzii pacienti DentNow" description="Recenzii pacienti DentNow si link catre profilul Google pentru verificare." path="/recenzii" />
      <PageHero tag="Recenzii pacienti" title='Ce spun <em class="ac">pacientii.</em>' subtitle="Recenzii verificate, preluate din profilul Google al clinicilor DentNow." />
      <div className="rating-hero" data-nav-dark>
        <div className="big-rating rv">4.8</div>
        <div className="rating-stars rv d1">★★★★★</div>
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
