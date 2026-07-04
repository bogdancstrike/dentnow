export default function ReviewCard({ review, className = '' }) {
  return (
    <div className={`review-card ${className}`}>
      <div className="review-stars">★★★★★</div>
      <p className="review-text">&ldquo;{review.text}&rdquo;</p>
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
