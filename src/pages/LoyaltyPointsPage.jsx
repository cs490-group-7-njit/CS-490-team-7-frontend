import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import '../styles/loyalty-points.css'

function LoyaltyPointsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchLoyaltyPoints = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/users/${user.id}/loyalty`)
        if (!response.ok) {
          throw new Error('Failed to fetch loyalty points')
        }
        const data = await response.json()
        setLoyaltyData(data)
      } catch (err) {
        console.error('Error fetching loyalty points:', err)
        setError('Failed to load loyalty points. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchLoyaltyPoints()
  }, [user, navigate])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="page loyalty-points-page">
        <Header />
        <div className="loading-container">
          <div className="loading">Loading loyalty points...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page loyalty-points-page">
        <Header />
        <main className="loyalty-container">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page loyalty-points-page">
      <Header />
      <main className="loyalty-container">
        <div className="loyalty-header">
          <h1>Your Loyalty Points</h1>
          <p className="subtitle">Earn points with every visit and redeem them for rewards</p>
        </div>

        {/* Total Points Summary */}
        <section className="loyalty-summary">
          <div className="points-card">
            <div className="points-value">{loyaltyData?.total_points || 0}</div>
            <div className="points-label">Total Points</div>
            <div className="points-sublabel">Across {loyaltyData?.total_salons || 0} salon{loyaltyData?.total_salons !== 1 ? 's' : ''}</div>
          </div>
        </section>

        {/* Loyalty by Salon */}
        {loyaltyData?.loyalty_by_salon && loyaltyData.loyalty_by_salon.length > 0 ? (
          <section className="loyalty-salons">
            <h2>Points by Salon</h2>
            <div className="loyalty-list">
              {loyaltyData.loyalty_by_salon.map((loyalty) => (
                <div key={loyalty.salon_id} className="loyalty-item">
                  <div className="loyalty-salon-info">
                    <h3>{loyalty.salon_name}</h3>
                    <p className="salon-id">Salon ID: {loyalty.salon_id}</p>
                  </div>
                  <div className="loyalty-points-display">
                    <span className="loyalty-points-number">{loyalty.points}</span>
                    <span className="loyalty-points-text">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="no-loyalty">
            <p>No loyalty points yet. Book an appointment to start earning!</p>
            <button onClick={() => navigate('/appointments')} className="cta-button">
              Book an Appointment
            </button>
          </section>
        )}

        {/* Rewards Info */}
        <section className="rewards-info">
          <h2>How It Works</h2>
          <div className="info-card">
            <div className="info-item">
              <span className="info-icon">💰</span>
              <div>
                <h4>Earn Points</h4>
                <p>Get points for every dollar spent on services</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🎁</span>
              <div>
                <h4>Redeem Rewards</h4>
                <p>Use your points for discounts on future services</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">⭐</span>
              <div>
                <h4>Exclusive Perks</h4>
                <p>Unlock special offers and rewards as you earn more</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LoyaltyPointsPage
