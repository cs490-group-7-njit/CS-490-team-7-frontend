import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLoyaltyRedemptions, getUserLoyalty, redeemLoyaltyPoints } from '../api/loyalty'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import '../styles/loyalty-points.css'

function LoyaltyPointsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [redemptions, setRedemptions] = useState([])
  const [redemptionsLoading, setRedemptionsLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [redeemError, setRedeemError] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redemptionResult, setRedemptionResult] = useState(null)

  const fetchLoyaltyPoints = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getUserLoyalty(user.id)
      setLoyaltyData(data)
    } catch (err) {
      console.error('Error fetching loyalty points:', err)
      setError('Failed to load loyalty points. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchRedemptions = useCallback(async () => {
    if (!user?.id) return
    setRedemptionsLoading(true)
    try {
      const data = await getLoyaltyRedemptions(user.id, { page: 1, limit: 5 })
      setRedemptions(data.redemptions || [])
    } catch (err) {
      console.error('Error fetching redemptions:', err)
    } finally {
      setRedemptionsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchLoyaltyPoints()
    fetchRedemptions()
  }, [user, navigate, fetchLoyaltyPoints, fetchRedemptions])

  const handleRedeem = async (event) => {
    event.preventDefault()
    setRedeemError(null)
    setRedemptionResult(null)

    const numericPoints = Number(redeemPoints)
    const availablePoints = loyaltyData?.total_points || 0

    if (!Number.isInteger(numericPoints) || numericPoints <= 0) {
      setRedeemError('Enter a whole number greater than 0.')
      return
    }

    if (numericPoints > availablePoints) {
      setRedeemError('You do not have enough points for that redemption.')
      return
    }

    try {
      setRedeeming(true)
      const data = await redeemLoyaltyPoints(user.id, numericPoints)
      setRedemptionResult(data.redemption)
      setRedeemPoints('')

      await Promise.all([fetchLoyaltyPoints(), fetchRedemptions()])
    } catch (err) {
      console.error('Redeem points error:', err)
      setRedeemError(err?.message || 'Unable to redeem points right now.')
    } finally {
      setRedeeming(false)
    }
  }

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
            <button onClick={() => fetchLoyaltyPoints()} className="retry-button">
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
            <div className="points-sublabel">
              Across {loyaltyData?.total_salons || 0} salon{loyaltyData?.total_salons !== 1 ? 's' : ''}
            </div>
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

        {/* Redeem Points */}
        <section className="redeem-section">
          <div className="redeem-header">
            <h2>Redeem Your Points</h2>
            <p>Convert points into discount codes instantly. 1 point = $0.05.</p>
          </div>
          <form className="redeem-form" onSubmit={handleRedeem}>
            <div className="redeem-inputs">
              <label htmlFor="redeem-points">Points to redeem</label>
              <input
                id="redeem-points"
                type="number"
                min="1"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="e.g. 200"
                disabled={redeeming || (loyaltyData?.total_points || 0) === 0}
              />
            </div>
            <button
              type="submit"
              className="redeem-button"
              disabled={redeeming || (loyaltyData?.total_points || 0) === 0}
            >
              {redeeming ? 'Redeeming…' : 'Redeem Points'}
            </button>
          </form>
          {redeemError && <p className="redeem-error">{redeemError}</p>}
          {redemptionResult && (
            <div className="redemption-result">
              <h3>Discount Code Ready</h3>
              <p className="code">
                Code: <strong>{redemptionResult.discount_code}</strong>
              </p>
              <p>
                Value:{' '}
                <strong>
                  ${Number(redemptionResult.discount_value_cents / 100).toFixed(2)}
                </strong>{' '}
                ({redemptionResult.points_redeemed} pts)
              </p>
              <p>Expires on {new Date(redemptionResult.expires_at).toLocaleDateString()}</p>
            </div>
          )}
        </section>

        {/* Redemption History */}
        <section className="redemptions-section">
          <div className="redemptions-header">
            <h2>Recent Redemptions</h2>
            <p>Track the codes you have generated lately.</p>
          </div>
          {redemptionsLoading ? (
            <div className="loading">Loading redemptions…</div>
          ) : redemptions.length === 0 ? (
            <div className="no-redemptions">
              <p>You have not redeemed any points yet.</p>
            </div>
          ) : (
            <div className="redemption-list">
              {redemptions.map((item) => (
                <article key={item.id} className="redemption-card">
                  <header>
                    <span className="code">{item.discount_code}</span>
                    <span className={`status ${item.is_used ? 'used' : 'active'}`}>
                      {item.is_used ? 'Used' : 'Active'}
                    </span>
                  </header>
                  <p className="value">
                    ${Number(item.discount_value_cents / 100).toFixed(2)} &middot;{' '}
                    {item.points_redeemed} pts
                  </p>
                  <p className="dates">
                    Redeemed {new Date(item.redeemed_at).toLocaleDateString()} &middot; Expires{' '}
                    {new Date(item.expires_at).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

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
