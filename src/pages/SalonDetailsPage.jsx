import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { getSalonDetails } from '../api/salons'
import './salon-details.css'

function SalonDetailsPage() {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSalon = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getSalonDetails(parseInt(salonId))
        setSalon(data.salon)
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

          {/* Ratings */}
          {salon.average_rating !== undefined && (
            <section className="ratings-section">
              <h2>Reviews</h2>
              <div className="ratings-info">
                <div className="rating-display">
                  <span className="rating-stars">⭐ {salon.average_rating}</span>
                  <span className="rating-count">
                    {salon.total_reviews} review{salon.total_reviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Vendor Info */}
          {salon.vendor && (
            <section className="vendor-section">
              <h2>Salon Vendor</h2>
              <div className="vendor-card">
                <p className="vendor-name">{salon.vendor.name}</p>
                {salon.vendor.email && (
                  <p className="vendor-email">📧 {salon.vendor.email}</p>
                )}
              </div>
            </section>
          )}
        </div>

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
        </section>
      </main>
    </div>
  )
}

export default SalonDetailsPage
