import { deleteReview } from '../api/reviews'

function ReviewList({ reviews, onReviewDeleted, currentUserId }) {
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await deleteReview(reviewId)
      if (onReviewDeleted) {
        onReviewDeleted(reviewId)
      }
    } catch (error) {
      console.error('Failed to delete review:', error)
      alert('Failed to delete review. Please try again.')
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="star-display">
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!reviews || reviews.length === 0) {
    return <div className="no-reviews">No reviews yet. Be the first to review!</div>
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="review-info">
              <h4 className="reviewer-name">{review.client_name}</h4>
              <span className="review-date">{formatDate(review.created_at)}</span>
            </div>
            {currentUserId === review.client_id && (
              <button
                onClick={() => handleDelete(review.id)}
                className="delete-review-btn"
                title="Delete review"
              >
                ✕
              </button>
            )}
          </div>

          <div className="review-rating">{renderStars(review.rating)}</div>

          <p className="review-comment">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}

export default ReviewList
