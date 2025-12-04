import { useEffect, useState } from 'react'
import { getMyShops } from '../api/shops'
import { getSalonAppointments, updateAppointmentStatus } from '../api/vendorAppointments'
import VendorLoadingState from '../components/VendorLoadingState'
import VendorPortalLayout from '../components/VendorPortalLayout'
import { useAuth } from '../context/AuthContext'
import './vendor-appointments.css'

function VendorAppointmentsPage() {
  const { user, refreshActivity } = useAuth()

  // Data state
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [appointments, setAppointments] = useState([])

  // Filter state
  const [statusFilter, setStatusFilter] = useState('booked')
  const [dateFilter, setDateFilter] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Refresh activity on mount
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load shops on mount
  useEffect(() => {
    if (user?.id) {
      loadShops()
    }
  }, [user])

  // Load appointments when shop or filters change
  useEffect(() => {
    if (selectedShop) {
      loadAppointments()
    }
  }, [selectedShop, statusFilter, dateFilter])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        // Auto-select first shop if available
        if (response.salons.length > 0) {
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load salons')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointments = async () => {
    if (!selectedShop) return

    try {
      setIsLoading(true)
      setError(null)
      const salonId = selectedShop.id ?? selectedShop.salon_id
      const data = await getSalonAppointments(
        salonId,
        statusFilter || undefined,
        dateFilter || undefined
      )
      setAppointments(data)
    } catch (err) {
      setError(err.message || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (!newStatus) return

    console.log('Changing appointment', appointmentId, 'to status:', newStatus)

    try {
      setUpdatingId(appointmentId)
      await updateAppointmentStatus(appointmentId, newStatus)
      setSuccessMessage(`Appointment marked as ${newStatus}`)

      // Reload appointments
      setTimeout(() => {
        loadAppointments()
        setSuccessMessage('')
      }, 1500)
    } catch (err) {
      console.error('Error updating appointment:', err)
      setError(err.message || 'Failed to update appointment')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`
  }

  const getAvailableStatusTransitions = (currentStatus) => {
    const transitions = {
      booked: ['completed', 'no-show', 'cancelled'],
      completed: [],
      cancelled: [],
      'no-show': [],
    }
    return transitions[currentStatus] || []
  }

  const statuses = ['booked', 'completed', 'cancelled', 'no-show']
  const today = new Date().toISOString().split('T')[0]

  if (isLoading && shops.length === 0) {
    return (
      <VendorPortalLayout activeKey="appointments">
        <VendorLoadingState message="Loading your appointments..." />
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="appointments">
      <div className="vendor-appointments-page">
        <div className="appointments-container">
          <h1>Manage Appointments</h1>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {shops.length === 0 ? (
            <div className="no-salons">
              <p>You don't have any salons yet. Create a salon to manage appointments.</p>
            </div>
          ) : (
            <>
              {/* Salon Selector */}
              <div className="controls-section">
                <div className="form-group">
                  <label htmlFor="salon-select">Select Salon:</label>
                  <select
                    id="salon-select"
                    value={selectedShop ? String(selectedShop.id ?? selectedShop.salon_id) : ''}
                    onChange={(e) => {
                      const shop = shops.find((s) => String(s.id ?? s.salon_id) === e.target.value)
                      setSelectedShop(shop || null)
                    }}
                  >
                    {shops.map(shop => (
                      <option key={shop.id ?? shop.salon_id} value={shop.id ?? shop.salon_id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="form-group">
                  <label htmlFor="status-filter">Filter by Status:</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="form-group">
                  <label htmlFor="date-filter">Filter by Date:</label>
                  <input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Appointments List */}
              {isLoading && shops.length > 0 && (
                <VendorLoadingState message="Updating appointments..." compact />
              )}

              {!isLoading && appointments.length === 0 ? (
                <div className="no-appointments">
                  <p>No appointments found with the selected filters.</p>
                </div>
              ) : (!isLoading && (
                <div className="appointments-list">
                  <div className="appointments-header">
                    <span className="col-time">Time</span>
                    <span className="col-client">Client</span>
                    <span className="col-service">Service</span>
                    <span className="col-staff">Staff</span>
                    <span className="col-status">Status</span>
                    <span className="col-actions">Actions</span>
                  </div>

                  {appointments.map(appt => {
                    const nextStatuses = getAvailableStatusTransitions(appt.status)
                    console.log('Appointment:', appt.id, 'Status:', appt.status, 'Next statuses:', nextStatuses, 'Full appt:', appt)

                    return (
                      <div key={appt.id} className="appointment-row">
                        <span className="col-time">{formatDateTime(appt.starts_at)}</span>
                        <span className="col-client">{appt.client?.name || 'Unknown'}</span>
                        <span className="col-service">
                          {appt.service?.name}
                          <span className="duration">({appt.service?.duration_minutes}min)</span>
                        </span>
                        <span className="col-staff">{appt.staff?.user?.name || 'Unknown'}</span>
                        <span className="col-status">
                          <span className={getStatusBadgeClass(appt.status)}>
                            {appt.status.toUpperCase()}
                          </span>
                        </span>
                        <span className="col-actions">
                          {nextStatuses.length > 0 && updatingId !== appt.id ? (
                            <div className="status-actions">
                              {nextStatuses.map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={(e) => {
                                    console.log('Button clicked!', status, appt.id)
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleStatusChange(appt.id, status)
                                  }}
                                  className={`status-btn status-btn-${status}`}
                                  title={`Mark as ${status}`}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                          ) : updatingId === appt.id ? (
                            <span className="updating">Updating...</span>
                          ) : (
                            <span className="no-actions">—</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </VendorPortalLayout>
  )
}

export default VendorAppointmentsPage
