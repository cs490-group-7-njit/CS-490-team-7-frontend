import { useState } from 'react'
import { postReview } from '../api/reviews'

function ReviewForm({ salonId, clientId, onReviewCreated, onCancel }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!comment.trim()) {
      setError('Please enter a comment')
      return
    }

    setLoading(true)
    try {
      const response = await postReview(salonId, {
        client_id: clientId,
        rating,
        comment: comment.trim(),
      })

      setComment('')
      setRating(5)

      if (onReviewCreated) {
        onReviewCreated(response.review)
      }
    } catch (err) {
      console.error('Failed to create review:', err)
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Leave a Review</h3>

      {error && <div className="review-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="rating">Rating</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-button ${star <= rating ? 'active' : ''}`}
              onClick={() => setRating(star)}
              title={`${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="rating-display">{rating} out of 5 stars</span>
      </div>

      <div className="form-group">
        <label htmlFor="comment">Your Review</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this salon..."
          rows="5"
          maxLength="1000"
          className="review-textarea"
        />
        <div className="char-count">{comment.length}/1000</div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default ReviewForm
