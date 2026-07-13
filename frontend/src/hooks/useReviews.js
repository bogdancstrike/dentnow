import { useQuery } from '@tanstack/react-query';
import { fetchReviews, publicQueryKeys } from '../api/publicClient';
import { usePreviewDraft } from '../api/previewDraft';

export function mergeReviewDraft(reviews, draft) {
  if (!draft) return reviews;

  const { __preview_position: originalPosition, ...publicDraft } = draft;
  const normalizedDraft = {
    ...publicDraft,
    rating: Number(publicDraft.rating || 5),
    position: Number(publicDraft.position || 0),
  };
  const index = reviews.findIndex((review) => (
    (normalizedDraft.id && review.id === normalizedDraft.id)
    || (typeof originalPosition === 'number' && review.position === originalPosition)
  ));

  if (index < 0) return [normalizedDraft, ...reviews];
  return reviews.map((review, reviewIndex) => (
    reviewIndex === index ? { ...review, ...normalizedDraft } : review
  ));
}

export function useReviews() {
  const { data: reviews = [], ...query } = useQuery({
    queryKey: publicQueryKeys.reviews,
    queryFn: fetchReviews,
  });
  const draft = usePreviewDraft('review');

  return { ...query, data: mergeReviewDraft(reviews, draft) };
}
