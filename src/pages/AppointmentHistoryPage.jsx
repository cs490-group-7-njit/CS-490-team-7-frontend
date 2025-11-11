import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import '../styles/appointment-history.css'

function AppointmentHistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('') // '' for all

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchAppointmentHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/appointments`)
        if (!response.ok) {
          throw new Error('Failed to fetch appointment history')
        }
        const data = await response.json()
        // Filter by status if needed
        let filteredAppointments = data.appointments || []
        if (statusFilter) {
          filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter)
        }
        setAppointments(filteredAppointments)
      } catch (err) {
        console.error('Error fetching appointments:', err)
        setError('Failed to load appointment history. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentHistory()
  }, [user, navigate, statusFilter])

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
        <div className="history-header">
          <h1>Appointment History</h1>
          <p className="subtitle">View and manage all your past appointments</p>
        </div>

        {/* Status Filter */}
        <section className="filter-section">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Appointments</option>
            <option value="completed">Completed</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
        </section>

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <section className="appointments-list">
            {appointments.map((appt) => (
              <div key={appt.id} className="appointment-card">
                <div className="card-header">
                  <div className="appointment-title">
                    <h3>{appt.service_name}</h3>
                    <p className="salon-name">{appt.salon_name}</p>
                  </div>
                  <span className={`status-badge ${getStatusBadge(appt.status)}`}>
                    {getStatusLabel(appt.status)}
                  </span>
                </div>

                <div className="card-body">
                  <div className="detail-row">
                    <span className="detail-label">📅 Date & Time:</span>
                    <span className="detail-value">
                      {formatDate(appt.starts_at)} at {formatTime(appt.starts_at)}
                    </span>
                  </div>

                  {appt.staff_name && (
                    <div className="detail-row">
                      <span className="detail-label">💇 Staff:</span>
                      <span className="detail-value">{appt.staff_name}</span>
                    </div>
                  )}

                  {appt.notes && (
                    <div className="detail-row">
                      <span className="detail-label">📝 Notes:</span>
                      <span className="detail-value">{appt.notes}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">⏱️ Duration:</span>
                    <span className="detail-value">
                      {Math.round((new Date(appt.ends_at) - new Date(appt.starts_at)) / 60000)} minutes
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    onClick={() => navigate(`/appointments/${appt.id}`)}
                    className="view-details-btn"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
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
