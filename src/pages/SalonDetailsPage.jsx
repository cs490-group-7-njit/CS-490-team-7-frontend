import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getSalonReviews } from '../api/reviews'
import { getSalonDetails } from '../api/salons'
import Header from '../components/Header'
import ReviewFilterBar from '../components/ReviewFilterBar'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { useAuth } from '../context/AuthContext'
import '../styles/review-filter.css'
import '../styles/reviews.css'
import './salon-details.css'

function SalonDetailsPage() {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [salon, setSalon] = useState(null)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [error, setError] = useState(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [reviewFilters, setReviewFilters] = useState({
    sort_by: 'date',
    order: 'desc',
    min_rating: undefined,
  })

  const fetchReviews = async (id, filters = {}) => {
    setLoadingReviews(true)
    try {
      const params = new URLSearchParams()
      params.append('sort_by', filters.sort_by || 'date')
      params.append('order', filters.order || 'desc')
      if (filters.min_rating) {
        params.append('min_rating', filters.min_rating)
      }

      const data = await getSalonReviews(id, params.toString())
      setReviews(data.reviews || [])
      setAverageRating(data.average_rating || 0)
      setTotalReviews(data.total_reviews || 0)
      setFilteredCount(data.filtered_count || data.reviews?.length || 0)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleFilterChange = (filters) => {
    setReviewFilters(filters)
    fetchReviews(parseInt(salonId), filters)
  }

  const handleReviewCreated = () => {
    fetchReviews(parseInt(salonId), reviewFilters)
  }

  const handleReviewDeleted = () => {
    fetchReviews(parseInt(salonId), reviewFilters)
  }

  useEffect(() => {
    const fetchSalon = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getSalonDetails(parseInt(salonId))
        setSalon(data.salon)
        await fetchReviews(parseInt(salonId), reviewFilters)
      } catch (err) {
        console.error('Failed to fetch salon details:', err)
        setError('Failed to load salon details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (salonId) {
      fetchSalon()
    }
  }, [salonId])

  // Memoize payment link variables to make intention clearer and prevent recalculation
  const paymentLinkInfo = useMemo(() => {
    const firstService = salon?.services?.[0]
    const firstServiceId = firstService?.service_id ?? firstService?.id
    const showPayOnlineButton = salon?.pay_online && salon?.services?.length > 0 && firstServiceId
    return { firstServiceId, showPayOnlineButton }
  }, [salon])

  // Memoize vendor contact button to prevent unnecessary re-renders
  const contactVendorButton = useMemo(() => {
    const vendorId = salon?.vendor?.user_id || salon?.vendor?.id
    if (!vendorId) {
      return <span className="vendor-unavailable">Vendor contact unavailable</span>
    }
    return (
      <Link to={`/messages/compose?vendorId=${vendorId}`}>
        <button className="btn-primary">Contact Vendor</button>
      </Link>
    )
  }, [salon?.vendor?.user_id, salon?.vendor?.id])

  if (loading) {
    return (
      <div className="page salon-details-page">
        <Header showSearch={false} />
        <div className="loading-container">
          <div className="loading">Loading salon details...</div>
        </div>
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="page salon-details-page">
        <Header showSearch={false} />
        <main className="salon-details-container">
          <div className="error-container">
            <h2>Oops! {error ? error : 'Salon not found'}</h2>
            <button onClick={() => navigate('/salons/search')} className="back-button">
              ← Back to Salons
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page salon-details-page">
      <Header showSearch={false} />

      <main className="salon-details-container">
        {/* Hero Section */}
        <section className="salon-hero">
          <div className="hero-content">
            <h1>{salon.name}</h1>
            {salon.business_type && (
              <p className="salon-type-badge">{salon.business_type}</p>
            )}
            <div className="salon-meta">
              {salon.address && salon.address.city && (
                <span className="location">
                  📍 {salon.address.city}
                  {salon.address.state && `, ${salon.address.state}`}
                </span>
              )}
              {salon.phone && (
                <span className="phone">
                  📞 {salon.phone}
                </span>
              )}
            </div>
            <button onClick={() => navigate('/salons/search')} className="back-button-hero">
              ← Back to Results
            </button>
          </div>
        </section>

        <div className="salon-content">
          {/* Description */}
          {salon.description && (
            <section className="description-section">
              <h2>About</h2>
              <p>{salon.description}</p>
            </section>
          )}

          {/* Address */}
          {salon.address && (
            <section className="address-section">
              <h2>Location</h2>
              <div className="address-info">
                {salon.address.line1 && <p>{salon.address.line1}</p>}
                {salon.address.line2 && <p>{salon.address.line2}</p>}
                {(salon.address.city || salon.address.state || salon.address.postal_code) && (
                  <p>
                    {salon.address.city && salon.address.city}
                    {salon.address.state && `, ${salon.address.state}`}
                    {salon.address.postal_code && ` ${salon.address.postal_code}`}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Services */}
          {salon.services && salon.services.length > 0 && (
            <section className="services-section">
              <h2>Services</h2>
              <div className="services-grid">
                {salon.services.map((service) => (
                  <div key={service.id} className="service-card">
                    <h3>{service.name}</h3>
                    {service.description && (
                      <p>{service.description}</p>
                    )}
                    <div className="service-details">
                      {service.duration && (
                        <span className="duration">⏱️ {service.duration} min</span>
                      )}
                      {service.price && (
                        <span className="price">${service.price}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Staff */}
          {salon.staff && salon.staff.length > 0 && (
            <section className="staff-section">
              <h2>Our Team</h2>
              <div className="staff-grid">
                {salon.staff.map((member) => (
                  <div key={member.id} className="staff-card">
                    <h3>{member.user?.name || 'Staff Member'}</h3>
                    {member.title && (
                      <p className="staff-title">{member.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews & Ratings */}
          <section className="reviews-section">
            <h2>Reviews & Ratings</h2>

            {/* Average Rating Display */}
            {averageRating > 0 && (
              <div className="average-rating-section">
                <div className="average-rating-display">
                  <div className="large-rating">{averageRating.toFixed(1)}</div>
                  <div className="star-display">
                    {'⭐'.repeat(Math.round(averageRating))}
                  </div>
                  <div className="review-count">
                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Review Form - Only show if user is authenticated */}
            {user && (
              <div className="review-form-container">
                <h3>Leave a Review</h3>
                <ReviewForm
                  salonId={parseInt(salonId)}
                  clientId={user.id}
                  onReviewCreated={handleReviewCreated}
                />
              </div>
            )}

            {!user && (
              <div className="login-prompt">
                <p>Please <button onClick={() => navigate('/login')} className="link-button">sign in</button> to leave a review</p>
              </div>
            )}

            {/* Review Filter Bar */}
            {reviews.length > 0 && (
              <ReviewFilterBar
                onFilterChange={handleFilterChange}
                totalReviews={totalReviews}
                filteredCount={filteredCount}
              />
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="loading-reviews">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              <ReviewList
                reviews={reviews}
                currentUserId={user?.id}
                onReviewDeleted={handleReviewDeleted}
              />
            ) : (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to review this salon!</p>
              </div>
            )}
          </section>

          {/* Vendor Info */}
          {salon.vendor && (
            <section className="vendor-section">
              <h2>Salon Vendor</h2>
              <div className="vendor-card">
                <p className="vendor-name">{salon.vendor.name}</p>
                {salon.vendor.email && (
                  <p className="vendor-email">📧 {salon.vendor.email}</p>
                )}
                {contactVendorButton}
              </div>
            </section>
          )}
        </div>

        {/* Analytics Section */}
        <section className="analytics-link-section">
          <button
            onClick={() => navigate(`/salons/${salonId}/analytics`)}
            className="analytics-button"
            title="View performance analytics for this salon"
          >
            📊 View Analytics
          </button>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2>Ready to book?</h2>
          <p>Schedule your appointment today</p>
          <button
            onClick={() => navigate('/appointments')}
            className="cta-button"
          >
            Book an Appointment
          </button>
          {paymentLinkInfo.showPayOnlineButton && (
            <Link to={`/payments/checkout?serviceId=${paymentLinkInfo.firstServiceId}`}>
              <button className="btn-secondary">Pay Online</button>
            </Link>
          )}
        </section>
      </main>
    </div>
  )
}

export default SalonDetailsPage
