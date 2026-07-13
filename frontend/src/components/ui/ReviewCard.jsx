export default function ReviewCard({ review, className = '' }) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5)));
  return (
    <div className={`review-card ${className}`}>
      <div className="review-stars" aria-label={`${rating} din 5 stele`}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </div>
      <p className="review-text">&ldquo;{review.text_body || review.text}&rdquo;</p>
      <div className="review-author">{review.author}</div>
      {review.guide && <div className="review-detail" style={{ fontSize: 13, color: 'var(--gray)' }}>{review.guide}</div>}
      {review.date && <div className="review-detail" style={{ fontSize: 13, color: 'var(--gray)' }}>{review.date}</div>}
      <div className="review-source">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray)', marginTop: 10, background: 'var(--bg)', padding: '3px 10px', borderRadius: 980 }}>
          🔵 Google Review
        </span>
      </div>
    </div>
  );
}
