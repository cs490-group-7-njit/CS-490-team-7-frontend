import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavoriteSalons } from '../api/favorites'
import ClientPortalLayout from '../components/ClientPortalLayout'
import { useAuth } from '../context/AuthContext'
import '../styles/favorite-salons.css'

function FavoriteSalonsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalSalons, setTotalSalons] = useState(0)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchFavorites = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getFavoriteSalons(user.id, page, 20)
        setSalons(data.salons || [])
        setHasMore(data.pagination.has_more)
        setTotalSalons(data.pagination.total)
      } catch (err) {
        console.error('Error fetching favorites:', err)
        setError('Failed to load favorite salons. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user, navigate, page])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <ClientPortalLayout
        activeKey="favorites"
        pageClassName="favorite-salons-page"
        contentClassName="favorites-container"
      >
        <div className="loading-container">
          <div className="loading">Loading favorite salons...</div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout
      activeKey="favorites"
      pageClassName="favorite-salons-page"
      contentClassName="favorites-container"
    >
      <div className="favorites-header">
        <h1>❤️ My Favorite Salons</h1>
        <p className="subtitle">Your saved favorite beauty salons</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {salons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💔</div>
          <h2>No favorite salons yet</h2>
          <p>Start adding salons to your favorites to view them here!</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/salons/search')}
          >
            Browse Salons
          </button>
        </div>
      ) : (
        <>
          <div className="favorites-info">
            <p>Total favorites: <strong>{totalSalons}</strong></p>
          </div>

          <div className="salons-grid">
            {salons.map((salon) => (
              <div key={salon.salon_id} className="salon-card">
                <div className="card-header">
                  <h3>{salon.name}</h3>
                  <span className="business-type">{salon.business_type}</span>
                </div>

                <div className="card-content">
                  <div className="info-item">
                    <strong>Vendor:</strong>
                    <span>{salon.vendor.name}</span>
                  </div>

                  <div className="info-item">
                    <strong>Address:</strong>
                    <span>{salon.address}</span>
                  </div>

                  <div className="info-item">
                    <strong>Phone:</strong>
                    <span>{salon.phone}</span>
                  </div>

                  {salon.description && (
                    <div className="info-item">
                      <strong>About:</strong>
                      <span>{salon.description}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate(`/salons/${salon.salon_id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(hasMore || page > 1) && (
            <div className="pagination">
              {page > 1 && (
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => setPage(page - 1)}
                >
                  ← Previous
                </button>
              )}

              <span className="page-info">
                Page {page} ({(page - 1) * 20 + 1} - {Math.min(page * 20, totalSalons)} of {totalSalons})
              </span>

              {hasMore && (
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </ClientPortalLayout>
  )
}

export default FavoriteSalonsPage
