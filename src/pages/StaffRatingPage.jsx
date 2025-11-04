import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStaffRating, getStaffReviews, rateStaff } from '../api/staffRatings';
import { useAuth } from '../context/AuthContext';
import '../pages/staff-rating.css';

export default function StaffRatingPage() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [staffName, setStaffName] = useState('');
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, [staffId]);

  async function loadStaffData() {
    try {
      setLoading(true);

      // Fetch staff rating stats
      const ratingData = await getStaffRating(staffId);
      setAvgRating(ratingData.avg_rating);
      setTotalRatings(ratingData.total_ratings);

      // Fetch existing reviews
      const reviewsData = await getStaffReviews(staffId, 1, 5);
      setReviews(reviewsData.reviews);

      // Try to get staff name from the first review or set a generic name
      if (reviewsData.reviews.length > 0) {
        setStaffName(`Staff Member #${staffId}`);
      } else {
        setStaffName(`Staff Member #${staffId}`);
      }
    } catch (err) {
      setError('Failed to load staff data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await rateStaff(staffId, user.id, rating, comment);

      setSuccess(true);
      setRating(0);
      setComment('');

      // Reload data
      await loadStaffData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to submit rating. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="staff-rating-container">
        <div className="staff-rating-error">
          <p>Please log in to rate staff members.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-rating-container">
      <div className="staff-rating-content">
        {/* Staff Header */}
        <div className="staff-header">
          <h1>{staffName}</h1>
          <div className="staff-stats">
            <div className="stat-item">
              <span className="stat-label">Average Rating</span>
              <span className="stat-value">
                {'⭐'.repeat(Math.round(avgRating))} {avgRating.toFixed(1)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Reviews</span>
              <span className="stat-value">{totalRatings}</span>
            </div>
          </div>
        </div>

        {/* Rating Form */}
        <div className="rating-form-section">
          <h2>Rate This Staff Member</h2>
          {success && (
            <div className="success-message">
              ✅ Your rating has been submitted successfully!
            </div>
          )}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rating-form">
            <div className="rating-input-group">
              <label htmlFor="rating">Rating (1-5 stars) *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <small>{rating > 0 ? `${rating} out of 5 stars` : 'Click to rate'}</small>
            </div>

            <div className="comment-input-group">
              <label htmlFor="comment">Comment (Optional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this staff member..."
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="btn-submit"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Previous Reviews */}
        {reviews.length > 0 && (
          <div className="reviews-section">
            <h2>Recent Reviews</h2>
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-author">{review.client_name}</span>
                    <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
