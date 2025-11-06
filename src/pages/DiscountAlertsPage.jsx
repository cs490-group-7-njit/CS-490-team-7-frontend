import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { dismissDiscountAlert, getDiscountAlerts } from '../api/discountAlerts'
import './discount-alerts.css'

function DiscountAlertsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeOnly, setActiveOnly] = useState(true)
  const [dismissingId, setDismissingId] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadAlerts()
  }, [user, navigate, activeOnly])

  const loadAlerts = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const data = await getDiscountAlerts(user.id, { activeOnly })
      setAlerts(data.alerts || [])
    } catch (err) {
      console.error('Failed to fetch discount alerts:', err)
      setError('Unable to load discount alerts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (alertId) => {
    try {
      setDismissingId(alertId)
      await dismissDiscountAlert(alertId)
      await loadAlerts()
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
      setError('Unable to dismiss this alert. Please try again.')
    } finally {
      setDismissingId(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="page discount-alerts-page">
      <Header />
      <main className="discount-alerts-container">
        <div className="alerts-header">
          <div>
            <p className="eyebrow">UC 2.14 &middot; Discount Alerts</p>
            <h1>Personalized Offers</h1>
            <p className="subtitle">
              Track the exclusive salon discounts and loyalty perks sent to you.
            </p>
          </div>
          <div className="alerts-actions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(event) => setActiveOnly(event.target.checked)}
              />
              <span>Show active alerts only</span>
            </label>
            <Link className="secondary-link" to="/notifications">
              ← Back to notifications
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert error">
            <p>{error}</p>
            <button type="button" onClick={loadAlerts}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <p>Collecting your discount alerts…</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <p className="icon" aria-hidden="true">🎁</p>
            <h2>No discount alerts right now</h2>
            <p>Check back soon — salons post new loyalty offers frequently.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/salons/search')}
            >
              Browse salons
            </button>
          </div>
        ) : (
          <section className="alerts-grid" aria-live="polite">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                className={`discount-card ${alert.is_dismissed ? 'dismissed' : ''}`}
              >
                <header>
                  <div>
                    <p className="salon-name">
                      {alert.salon?.name || 'Any salon'}
                    </p>
                    <h3>{alert.description}</h3>
                  </div>
                  <span className="badge">
                    Save {alert.discount_percentage}% (${(alert.discount_cents / 100).toFixed(2)})
                  </span>
                </header>
                <ul className="meta">
                  <li>
                    Added {new Date(alert.created_at).toLocaleDateString()}
                  </li>
                  <li>
                    Expires {new Date(alert.expires_at).toLocaleDateString()}
                  </li>
                  <li>
                    Status: {alert.is_dismissed ? 'Dismissed' : 'Active'}
                  </li>
                </ul>
                <footer>
                  <button
                    type="button"
                    className="dismiss-button"
                    onClick={() => handleDismiss(alert.id)}
                    disabled={alert.is_dismissed || dismissingId === alert.id}
                  >
                    {alert.is_dismissed
                      ? 'Dismissed'
                      : dismissingId === alert.id
                        ? 'Dismissing…'
                        : 'Dismiss alert'}
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default DiscountAlertsPage
