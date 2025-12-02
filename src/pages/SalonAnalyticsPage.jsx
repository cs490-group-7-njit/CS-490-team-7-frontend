import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSalonAnalytics } from '../api/analytics'
import Header from '../components/Header'
import './salon-analytics.css'

function SalonAnalyticsPage() {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [salonId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await getSalonAnalytics(salonId)
      setAnalytics(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Header />
        <div className="analytics-container">
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <Header />
        <div className="analytics-container">
          <div className="error-message">
            <p>{error}</p>
            <button type="button" className="btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="page">
        <Header />
        <div className="analytics-container">
          <p>No analytics available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Header />
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>{analytics.salon_name} - Performance Analytics</h1>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Back to Salon
          </button>
        </div>

        {/* Booking Stats */}
        <section className="analytics-section">
          <h2>Booking Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{analytics.bookings.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{analytics.bookings.completed}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cancelled</div>
              <div className="stat-value">{analytics.bookings.cancelled}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completion Rate</div>
              <div className="stat-value">{analytics.bookings.completion_rate}%</div>
            </div>
          </div>
        </section>

        {/* Reviews Stats */}
        <section className="analytics-section">
          <h2>Customer Reviews</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Average Rating</div>
              <div className="stat-value">
                <span
                  className={`rating${analytics.reviews.avg_rating > 0 ? '' : ' rating-muted'}`}
                >
                  {analytics.reviews.avg_rating > 0
                    ? `${analytics.reviews.avg_rating} ⭐`
                    : 'No ratings'}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Reviews</div>
              <div className="stat-value">{analytics.reviews.total_reviews}</div>
            </div>
          </div>
        </section>

        {/* Services Stats */}
        <section className="analytics-section">
          <h2>Services</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Services</div>
              <div className="stat-value">{analytics.services.total_count}</div>
            </div>
          </div>

          {analytics.services.top_rated.length > 0 && (
            <div className="top-services">
              <h3>Top Rated Services</h3>
              <div className="services-list">
                {analytics.services.top_rated.map((service) => (
                  <div key={service.service_id} className="service-item">
                    <div className="service-name">{service.name}</div>
                    <div className="service-stats">
                      <span className={`rating${service.avg_rating > 0 ? '' : ' rating-muted'}`}>
                        {service.avg_rating > 0 ? `${service.avg_rating} ⭐` : 'No ratings'}
                      </span>
                      <span className="review-count">
                        ({service.review_count} {service.review_count === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="analytics-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={fetchAnalytics}
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export default SalonAnalyticsPage
