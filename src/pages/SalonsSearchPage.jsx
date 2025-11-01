import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchSalons } from '../api/salons'
import Header from '../components/Header'
import './salons-search.css'

function SalonsSearchPage() {
  const navigate = useNavigate()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter and search state
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({})

  // Available filter options (can be fetched from backend or hardcoded)
  const businessTypes = [
    'Hair Salon',
    'Nail Salon',
    'Spa',
    'Barber Shop',
    'Beauty Salon',
    'Threading',
  ]

  // Fetch salons when filters change
  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchSalons({
          query,
          city,
          business_type: businessType,
          sort,
          order,
          page,
          limit: 12,
        })
        setSalons(data.salons || [])
        setPagination(data.pagination || {})
        setFilters(data.filters || {})
      } catch (err) {
        console.error('Failed to fetch salons:', err)
        setError('Failed to load salons. Please try again.')
        setSalons([])
      } finally {
        setLoading(false)
      }
    }

    fetchSalons()
  }, [query, city, businessType, sort, order, page])

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  // Clear all filters
  const clearFilters = () => {
    setQuery('')
    setCity('')
    setBusinessType('')
    setSort('created_at')
    setOrder('desc')
    setPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = query || city || businessType

  return (
    <div className="page salons-search-page">
      <Header />

      <main className="salons-search-container">
        {/* Search Bar */}
        <section className="search-section">
          <h1>Find Your Perfect Salon</h1>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search by salon name..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>
        </section>

        <div className="salons-content">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3>Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear All
                </button>
              )}
            </div>

            {/* City Filter */}
            <div className="filter-group">
              <label htmlFor="city-filter">City</label>
              <input
                id="city-filter"
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  setPage(1)
                }}
                className="filter-input"
              />
            </div>

            {/* Business Type Filter */}
            <div className="filter-group">
              <label htmlFor="type-filter">Type of Salon</label>
              <select
                id="type-filter"
                value={businessType}
                onChange={(e) => {
                  setBusinessType(e.target.value)
                  setPage(1)
                }}
                className="filter-select"
              >
                <option value="">All Types</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label htmlFor="sort-filter">Sort By</label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
                className="filter-select"
              >
                <option value="created_at">Newest</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="order-filter">Order</label>
              <select
                id="order-filter"
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value)
                  setPage(1)
                }}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </aside>

          {/* Results Section */}
          <section className="results-section">
            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="active-filters">
                {query && (
                  <span className="filter-badge">
                    Search: "{query}"
                    <button
                      onClick={() => {
                        setQuery('')
                        setPage(1)
                      }}
                      className="remove-filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {city && (
                  <span className="filter-badge">
                    City: {city}
                    <button
                      onClick={() => {
                        setCity('')
                        setPage(1)
                      }}
                      className="remove-filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {businessType && (
                  <span className="filter-badge">
                    Type: {businessType}
                    <button
                      onClick={() => {
                        setBusinessType('')
                        setPage(1)
                      }}
                      className="remove-filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Count */}
            {!loading && (
              <p className="results-count">
                {pagination.total || 0} salon{pagination.total !== 1 ? 's' : ''} found
              </p>
            )}

            {/* Loading State */}
            {loading && <div className="loading">Loading salons...</div>}

            {/* Error State */}
            {error && <div className="error-message">{error}</div>}

            {/* Salons Grid */}
            {!loading && !error && (
              <>
                {salons.length > 0 ? (
                  <div className="salons-grid">
                    {salons.map((salon) => (
                      <div
                        key={salon.id}
                        className="salon-card"
                        onClick={() => navigate(`/salons/${salon.id}`)}
                      >
                        <div className="salon-card-header">
                          <h3>{salon.name}</h3>
                          {salon.business_type && (
                            <span className="salon-type">{salon.business_type}</span>
                          )}
                        </div>

                        <p className="salon-description">
                          {salon.description || 'No description available'}
                        </p>

                        {salon.address && (
                          <p className="salon-location">
                            {salon.address.city && (
                              <>
                                {salon.address.city}
                                {salon.address.state && `, ${salon.address.state}`}
                              </>
                            )}
                          </p>
                        )}

                        {salon.phone && (
                          <p className="salon-phone">
                            <span className="phone-label">Phone:</span> {salon.phone}
                          </p>
                        )}

                        <div className="salon-card-footer">
                          {salon.vendor && (
                            <span className="vendor-name">{salon.vendor.name}</span>
                          )}
                          <span className="view-details">View Details →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <p>No salons found matching your criteria.</p>
                    <button onClick={clearFilters} className="try-again-btn">
                      Clear Filters & Try Again
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>

                    <div className="pagination-info">
                      Page {pagination.page || 1} of {pagination.pages || 1}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page >= (pagination.pages || 1)}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default SalonsSearchPage
