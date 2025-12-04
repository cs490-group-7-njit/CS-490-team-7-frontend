import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { listAppointments } from '../api/appointments'
import '../styles/appointment-history.css'

const PAGE_SIZE = 5
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
]

function AppointmentHistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('') // '' for all
  const [page, setPage] = useState(1)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchAppointmentHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listAppointments()
        // Filter by status if needed
        let filteredAppointments = data || []
        if (statusFilter) {
          filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter)
        }
        setAppointments(filteredAppointments)
        setPage(1)
        setShowAll(false)
      } catch (err) {
        console.error('Error fetching appointments:', err)
        setError('Failed to load appointment history. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentHistory()
  }, [user, navigate, statusFilter])
  const totalAppointments = appointments.length

  const effectivePageSize = showAll ? totalAppointments || 1 : PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalAppointments / effectivePageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * effectivePageSize
  const end = start + effectivePageSize
  const visibleAppointments = appointments.slice(start, end)
  const now = new Date()
  const bookedCount = appointments.filter((apt) => apt.status === 'booked').length
  const completedCount = appointments.filter((apt) => apt.status === 'completed').length
  const cancelledCount = appointments.filter((apt) => apt.status === 'cancelled').length
  const upcomingCount = appointments.filter((apt) => new Date(apt.starts_at) > now).length

  const getStatusBadge = (status) => {
    const statusClasses = {
      booked: 'status-booked',
      completed: 'status-completed',
      'no-show': 'status-no-show',
      cancelled: 'status-cancelled',
    }
    return statusClasses[status] || 'status-default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      booked: 'Booked',
      completed: 'Completed',
      'no-show': 'No Show',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="page appointment-history-page">
        <Header />
        <div className="loading-container">
          <div className="loading">Loading appointment history...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page appointment-history-page">
        <Header />
        <main className="history-container">
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
    <div className="page appointment-history-page">
      <Header />
      <main className="history-container">
        <div className="history-hero">
          <div>
            <p className="eyebrow">Your bookings</p>
            <h1>Appointment History</h1>
            <p className="subtitle">Review every visit, reschedule fast, and keep track of what comes next.</p>
          </div>
          <div className="hero-meta">
            <span className="hero-badge">{totalAppointments} total</span>
            <span className="hero-date">{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <section className="metrics-grid">
          <div className="metric-card">
            <p className="metric-label">Upcoming</p>
            <p className="metric-value">{upcomingCount}</p>
            <p className="metric-subtext">Scheduled after today</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Booked</p>
            <p className="metric-value">{bookedCount}</p>
            <p className="metric-subtext">Awaiting your visit</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Completed</p>
            <p className="metric-value">{completedCount}</p>
            <p className="metric-subtext">Finished visits</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Cancelled</p>
            <p className="metric-value">{cancelledCount}</p>
            <p className="metric-subtext">Cancelled or no-show</p>
          </div>
        </section>

        {/* Status Filter */}
        <section className="filter-row">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-chips">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value || 'all-chip'}
                type="button"
                className={`filter-chip ${statusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Appointments List */}
        {visibleAppointments.length > 0 ? (
          <section className="appointments-list">
            {visibleAppointments.map((appt) => (
              <div key={appt.id} className="appointment-card">
                <div className="card-header">
                  <div className="appointment-title">
                    <p className="card-date">{formatDate(appt.starts_at)}</p>
                    <h3>{appt.service_name}</h3>
                    <p className="salon-name">{appt.salon_name}</p>
                  </div>
                  <div className="status-stack">
                    <span className={`status-badge ${getStatusBadge(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                    <span className="time-pill">{formatTime(appt.starts_at)}</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="card-meta-grid">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <div>
                        <p className="meta-label">Date & Time</p>
                        <p className="meta-value">
                          {formatDate(appt.starts_at)} at {formatTime(appt.starts_at)}
                        </p>
                      </div>
                    </div>

                    {appt.staff_name && (
                      <div className="meta-item">
                        <span className="meta-icon">💇</span>
                        <div>
                          <p className="meta-label">Staff</p>
                          <p className="meta-value">{appt.staff_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="meta-item">
                      <span className="meta-icon">⏱️</span>
                      <div>
                        <p className="meta-label">Duration</p>
                        <p className="meta-value">
                          {Math.round((new Date(appt.ends_at) - new Date(appt.starts_at)) / 60000)} minutes
                        </p>
                      </div>
                    </div>

                    {appt.notes && (
                      <div className="meta-item span-2">
                        <span className="meta-icon">📝</span>
                        <div>
                          <p className="meta-label">Notes</p>
                          <p className="meta-value">{appt.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <div className="card-footer-left">
                    <span className="pill">{getStatusLabel(appt.status)}</span>
                    <span className="pill light">{formatDate(appt.starts_at)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/appointments/${appt.id}`)}
                    className="view-details-btn"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
            <div className="list-footer">
              <div className="list-meta">
                Showing {visibleAppointments.length} of {totalAppointments} {statusFilter ? statusFilter : 'appointments'}
              </div>
              <div className="pager">
                <button
                  type="button"
                  className="pager-btn"
                  onClick={() => {
                    setShowAll((prev) => !prev)
                    setPage(1)
                  }}
                >
                  {showAll ? 'Show paged' : 'Show all'}
                </button>
                <button
                  type="button"
                  className="pager-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || showAll}
                >
                  ← Prev
                </button>
                <span className="pager-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="pager-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || showAll}
                >
                  Next →
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="no-appointments">
            <div className="empty-state">
              <p className="empty-icon">📋</p>
              <p className="empty-text">No appointment history yet</p>
              <p className="empty-subtext">Book your first appointment to get started</p>
              <button onClick={() => navigate('/appointments')} className="cta-button">
                Book an Appointment
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AppointmentHistoryPage
