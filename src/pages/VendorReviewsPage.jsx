import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addVendorReply, deleteVendorReply, getSalonReviewsWithReplies, updateVendorReply } from '../api/reviews'
import { getMyShops } from '../api/shops'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import { useAuth } from '../context/AuthContext'
import './vendor-reviews.css'

function VendorReviewsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Data state
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [reviews, setReviews] = useState([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterReplied, setFilterReplied] = useState(false)

  // Reply form state
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Redirect if not vendor
  useEffect(() => {
    if (user && user.role !== 'vendor') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Load shops on mount
  useEffect(() => {
    if (user?.id) {
      loadShops()
    }
  }, [user])

  // Load reviews when shop selection changes
  useEffect(() => {
    if (selectedShop) {
      loadReviews()
    }
  }, [selectedShop, filterReplied])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        // Auto-select first shop if available
        if (response.salons.length > 0) {
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load salons')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviews = async () => {
    if (!selectedShop) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getSalonReviewsWithReplies(
        selectedShop.id,
        filterReplied,
        50,
        0
      )
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err.message || 'Failed to load reviews')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopChange = (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    if (shop) {
      setSelectedShop(shop)
      setReplyingTo(null)
      setReplyText('')
    }
  }

  const handleReplyClick = (review) => {
    setReplyingTo(review.id)
    setReplyText(review.vendor_reply || '')
    setReplyError(null)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyText('')
    setReplyError(null)
  }

  const handleSubmitReply = async (reviewId, isUpdate = false) => {
    if (!replyText.trim()) {
      setReplyError('Reply cannot be empty')
      return
    }

    try {
      setSubmittingReply(true)
      setReplyError(null)

      const replyData = {
        vendor_reply: replyText,
        vendor_id: user.id
      }

      if (isUpdate) {
        await updateVendorReply(reviewId, replyData)
        setSuccessMessage('Reply updated successfully!')
      } else {
        await addVendorReply(reviewId, replyData)
        setSuccessMessage('Reply added successfully!')
      }

      setReplyingTo(null)
      setReplyText('')

      // Reload reviews
      await loadReviews()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setReplyError(err.message || 'Failed to submit reply')
      console.error(err)
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return
    }

    try {
      setSubmittingReply(true)
      await deleteVendorReply(reviewId, user.id)
      setSuccessMessage('Reply deleted successfully!')
      await loadReviews()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete reply')
      console.error(err)
    } finally {
      setSubmittingReply(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating)
  }

  if (!user || user.role !== 'vendor') {
    return null
  }

  return (
    <VendorPortalLayout activeKey="reviews">
      <div className="vendor-reviews-page">
        <div className="vendor-reviews-container">
        <div className="reviews-header">
          <h1>Customer Reviews & Replies</h1>
          <p className="subtitle">Manage your salon's reviews and engage with customer feedback</p>
        </div>

        {/* Shop Selection */}
        <section className="shop-selector-section">
          <label htmlFor="shop-select">Select Salon:</label>
          <select
            id="shop-select"
            value={selectedShop?.id || ''}
            onChange={(e) => handleShopChange(parseInt(e.target.value))}
            className="shop-select"
            disabled={shops.length === 0}
          >
            {shops.length === 0 ? (
              <option>No salons available</option>
            ) : (
              shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))
            )}
          </select>
        </section>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Filter Options */}
        {reviews.length > 0 && (
          <section className="filter-section">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterReplied}
                onChange={(e) => setFilterReplied(e.target.checked)}
              />
              <span>Show only reviews with replies</span>
            </label>
          </section>
        )}

        {/* Reviews List */}
        <section className="reviews-section">
          {isLoading ? (
            <VendorLoadingState message="Loading reviews..." />
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              {filterReplied ? (
                <p>No reviews with replies yet</p>
              ) : (
                <p>No reviews yet for this salon</p>
              )}
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  {/* Review Section */}
                  <div className="review-content">
                    <div className="review-header">
                      <div className="review-info">
                        <h3 className="reviewer-name">{review.client_name}</h3>
                        <div className="rating">
                          {renderStars(review.rating)}
                          <span className="rating-number">({review.rating}/5)</span>
                        </div>
                      </div>
                      <div className="review-date">{formatDate(review.created_at)}</div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>

                  {/* Vendor Reply Section */}
                  <div className="vendor-reply-section">
                    {review.vendor_reply ? (
                      <div className="vendor-reply-display">
                        <div className="reply-header">
                          <span className="reply-label">Your Reply</span>
                          <span className="reply-date">{formatDate(review.vendor_reply_at)}</span>
                        </div>
                        <p className="reply-text">{review.vendor_reply}</p>
                        <div className="reply-actions">
                          {replyingTo !== review.id && (
                            <>
                              <button
                                className="btn-small btn-edit"
                                onClick={() => handleReplyClick(review)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-small btn-delete"
                                onClick={() => handleDeleteReply(review.id)}
                                disabled={submittingReply}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      replyingTo !== review.id && (
                        <button
                          className="btn-reply"
                          onClick={() => handleReplyClick(review)}
                        >
                          Add Reply
                        </button>
                      )
                    )}

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="reply-form">
                        <textarea
                          className="reply-textarea"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply here..."
                          rows="4"
                          disabled={submittingReply}
                        />
                        {replyError && (
                          <div className="form-error">{replyError}</div>
                        )}
                        <div className="form-actions">
                          <button
                            className="btn-submit"
                            onClick={() => handleSubmitReply(review.id, !!review.vendor_reply)}
                            disabled={submittingReply}
                          >
                            {submittingReply ? 'Submitting...' : (review.vendor_reply ? 'Update Reply' : 'Add Reply')}
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={handleCancelReply}
                            disabled={submittingReply}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>
    </VendorPortalLayout>
  )
}

export default VendorReviewsPage
