import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from './Header'
import './barber-dashboard.css'

export default function BarberDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'barber') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleViewSchedule = () => {
    navigate('/schedule/daily')
  }

  const handleBlockTime = () => {
    navigate('/schedule/block-time')
  }

  const handleViewAppointments = () => {
    navigate('/appointments')
  }

  if (loading) {
    return (
      <div className="barber-dashboard">
        <Header />
        <div className="barber-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="barber-dashboard">
      <Header />
      <div className="barber-content">
        <div className="barber-header">
          <h1>Welcome, {user?.name}</h1>
          <p className="subtitle">Barber Schedule Management</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="barber-grid">
          <div className="barber-card">
            <div className="card-icon">📅</div>
            <h2>Daily Schedule</h2>
            <p>View your daily appointments and available time slots</p>
            <button className="btn btn-primary" onClick={handleViewSchedule}>
              View Schedule
            </button>
          </div>

          <div className="barber-card">
            <div className="card-icon">🚫</div>
            <h2>Block Time Slots</h2>
            <p>Mark unavailable times for breaks, lunch, or personal time</p>
            <button className="btn btn-primary" onClick={handleBlockTime}>
              Block Time
            </button>
          </div>

          <div className="barber-card">
            <div className="card-icon">📋</div>
            <h2>Appointments</h2>
            <p>View all your scheduled appointments</p>
            <button className="btn btn-primary" onClick={handleViewAppointments}>
              View Appointments
            </button>
          </div>
        </div>

        <div className="barber-info">
          <h3>Quick Info</h3>
          <ul>
            <li>📌 Your role: <strong>{user?.role || 'N/A'}</strong></li>
            <li>📧 Email: <strong>{user?.email || 'N/A'}</strong></li>
            <li>📱 Phone: <strong>{user?.phone || 'Not set'}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
