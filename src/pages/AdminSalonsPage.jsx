import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSalons, getSalonSummary } from '../api/admin'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './admin-salons.css'

function AdminSalonsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [salons, setSalons] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Fetch salons
  const fetchSalons = async () => {
    try {
      setLoading(true)
      const response = await getAllSalons({
        status: selectedStatus,
        businessType: selectedBusinessType,
        sortBy,
        order: sortOrder,
        limit: pagination.limit,
        offset: pagination.offset
      })
      setSalons(response.salons || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Error fetching salons:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await getSalonSummary()
      setSummary(response.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSalons()
    fetchSummary()
  }, [selectedStatus, selectedBusinessType, sortBy, sortOrder])

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.has_more) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
    }
  }

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
    }
  }

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleBusinessTypeChange = (businessType) => {
    setSelectedBusinessType(businessType)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'badge-approved'
      case 'pending':
        return 'badge-pending'
      case 'rejected':
        return 'badge-rejected'
      default:
        return ''
    }
  }

  const getActivityBadgeClass = (isActive) => {
    return isActive ? 'badge-active' : 'badge-inactive'
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push('★')
    }
    if (hasHalfStar) {
      stars.push('☆')
    }
    while (stars.length < 5) {
      stars.push('☆')
    }

    return stars.join('')
  }

  return (
    <div className="page admin-salons-page">
      <Header />
      <main className="admin-container">
        <div className="admin-header">
          <h1>Salon Management</h1>
          <p className="subtitle">Monitor salon performance and business activity</p>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="loading">Loading summary...</div>
        ) : summary ? (
          <section className="summary-section">
            <div className="summary-card">
              <div className="card-icon">🏪</div>
              <div className="card-content">
                <p className="card-label">Total Salons</p>
                <p className="card-value">{summary.total_salons.toLocaleString()}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <p className="card-label">Active Salons</p>
                <p className="card-value">
                  {summary.active_salons.toLocaleString()}
                  <span className="card-percentage"> ({summary.active_percentage}%)</span>
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <p className="card-label">Average Rating</p>
                <p className="card-value">{summary.average_metrics.overall_rating}/5</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <p className="card-label">By Status</p>
                <p className="card-breakdown">
                  Approved: {summary.by_status.approved} |
                  Pending: {summary.by_status.pending} |
                  Rejected: {summary.by_status.rejected}
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <p className="card-label">Avg Staff/Salon</p>
                <p className="card-value">{summary.average_metrics.staff_per_salon}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <p className="card-label">Avg Appointments/Salon</p>
                <p className="card-value">{summary.average_metrics.appointments_per_salon}</p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <section className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="business-type-filter">Business Type:</label>
            <select
              id="business-type-filter"
              value={selectedBusinessType}
              onChange={(e) => handleBusinessTypeChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="hair">Hair Salon</option>
              <option value="nail">Nail Salon</option>
              <option value="spa">Spa</option>
              <option value="barber">Barbershop</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort by:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="created_at">Join Date</option>
              <option value="name">Name</option>
              <option value="verification_status">Status</option>
            </select>
          </div>

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </section>

        {/* Salons Table */}
        <section className="salons-section">
          {loading ? (
            <div className="loading">Loading salons...</div>
          ) : salons.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="salons-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSortChange('name')} className="sortable">
                        Salon Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Business Type</th>
                      <th onClick={() => handleSortChange('verification_status')} className="sortable">
                        Status {sortBy === 'verification_status' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Joined</th>
                      <th>Rating</th>
                      <th>Services</th>
                      <th>Staff</th>
                      <th>Appointments</th>
                      <th>Reviews</th>
                      <th>Recent Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salons.map((salon) => (
                      <tr key={salon.salon_id}>
                        <td className="salon-name">{salon.name}</td>
                        <td className="business-type">{salon.business_type || 'Not specified'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(salon.verification_status)}`}>
                            {salon.verification_status}
                          </span>
                        </td>
                        <td>{formatDate(salon.created_at)}</td>
                        <td className="rating-cell">
                          <span className="stars">{renderStars(salon.average_rating)}</span>
                          <span className="rating-number">({salon.average_rating})</span>
                        </td>
                        <td className="metric-cell">{salon.services_count}</td>
                        <td className="metric-cell">{salon.staff_count}</td>
                        <td className="metric-cell">{salon.appointments_count}</td>
                        <td className="metric-cell">{salon.reviews_count}</td>
                        <td>
                          <div className="activity-cell">
                            <span className={`activity-badge ${getActivityBadgeClass(salon.is_active)}`}>
                              {salon.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="recent-count">
                              {salon.recent_appointments} recent
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {pagination.pages}
                  ({pagination.total} total salons)
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.has_more}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">No salons found</div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminSalonsPage