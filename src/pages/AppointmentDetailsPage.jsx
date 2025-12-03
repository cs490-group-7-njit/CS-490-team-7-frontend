import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cancelAppointment, getAppointment, getAvailableSlotsForReschedule, rescheduleAppointment } from '../api/appointmentDetails'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './appointment-details.css'

function AppointmentDetailsPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { refreshActivity } = useAuth()

  // Appointment data
  const [appointment, setAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI state
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isRescheduling, setIsRescheduling] = useState(false)

  // Load appointment on mount / when id changes
  useEffect(() => {
    loadAppointment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Refresh activity when appointment is loaded
  useEffect(() => {
    if (appointment && !isLoading) {
      refreshActivity()
    }
    // Only re-run when appointment ID changes, appointment is loaded, or refreshActivity changes
  }, [appointment?.appointment_id, isLoading, refreshActivity])

  const loadAppointment = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointment(appointmentId)
      console.log('Appointment data:', data)
      setAppointment(data)
    } catch (err) {
      setError(err.message || 'Failed to load appointment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleDate = async (e) => {
    const date = e.target.value
    setRescheduleDate(date)
    setSelectedSlot(null)
    setAvailableSlots([])

    if (date && appointment) {
      try {
        const slots = await getAvailableSlotsForReschedule(
          appointment.staff_id,
          date,
          appointment.service.duration_minutes
        )
        setAvailableSlots(slots)
      } catch (err) {
        setError('Failed to load available slots')
      }
    }
  }

  const handleCancelAppointment = async () => {
    try {
      setIsLoading(true)
      await cancelAppointment(appointmentId)
      setSuccessMessage('Appointment cancelled successfully!')

      setTimeout(() => {
        navigate('/appointments/history')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment')
    } finally {
      setIsLoading(false)
      setShowCancelConfirm(false)
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot')
      return
    }

    try {
      setIsRescheduling(true)
      await rescheduleAppointment(appointmentId, selectedSlot)
      setSuccessMessage('Appointment rescheduled successfully!')

      // Reload appointment data
      setTimeout(() => {
        loadAppointment()
        setShowRescheduleForm(false)
        setRescheduleDate('')
        setSelectedSlot(null)
        setAvailableSlots([])
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment')
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const isUpcoming = appointment && new Date(appointment.starts_at) > new Date()
  const canReschedule = appointment && isUpcoming && appointment.status === 'booked'
  const canCancel = appointment && isUpcoming && appointment.status === 'booked'

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  if (isLoading && !appointment) {
    return (
      <div className="appointment-details-page">
        <Header />
        <div className="details-container">
          <div className="loading-spinner"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="appointment-details-page">
        <Header />
        <div className="details-container">
          <div className="error-message">{error}</div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/appointments/history')}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="appointment-details-page">
        <Header />
        <div className="details-container">
          <p>Appointment not found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/appointments/history')}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="appointment-details-page">
      <Header />
      <div className="details-container">
        <div className="details-header">
          <h1>Appointment Details</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/appointments/history')}
          >
            ← Back
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="appointment-card">
          {/* Status Badge */}
          <div className="status-section">
            <span className={getStatusBadgeClass(appointment.status)}>
              {appointment.status.toUpperCase()}
            </span>
            {isUpcoming && <span className="upcoming-badge">UPCOMING</span>}
          </div>

          {/* Service Details */}
          <section className="section service-section">
            <h2>Service</h2>
            <div className="detail-row">
              <span className="label">Service Name:</span>
              <span className="value">{appointment.service.name}</span>
            </div>
            {appointment.service.description && (
              <div className="detail-row">
                <span className="label">Description:</span>
                <span className="value">{appointment.service.description}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">Duration:</span>
              <span className="value">{appointment.service.duration_minutes} minutes</span>
            </div>
            <div className="detail-row">
              <span className="label">Price:</span>
              <span className="value price">
                ${appointment.service.price_dollars.toFixed(2)}
              </span>
            </div>
          </section>

          {/* Salon Details */}
          <section className="section salon-section">
            <h2>Salon</h2>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{appointment.salon.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Address:</span>
              <span className="value">
                {appointment.salon.address}
                <br />
                {appointment.salon.city}, {appointment.salon.state}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Phone:</span>
              <span className="value">{appointment.salon.phone}</span>
            </div>
          </section>

          {/* Staff Details */}
          <section className="section staff-section">
            <h2>Staff Member</h2>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{appointment.staff.user?.name || 'Staff Member'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Title:</span>
              <span className="value">{appointment.staff.title}</span>
            </div>
            <div className="detail-row staff-actions">
              <button
                className="btn-rate-staff"
                onClick={() => {
                  console.log('Staff object:', appointment.staff)
                  const staffId = appointment.staff.staff_id || appointment.staff.id
                  if (!staffId) {
                    console.error('No staff ID found')
                    return
                  }
                  navigate(`/staff/${staffId}/rate`)
                }}
              >
                ⭐ Rate This Staff Member
              </button>
            </div>
          </section>

          {/* DateTime Details */}
          <section className="section datetime-section">
            <h2>Appointment Time</h2>
            <div className="detail-row">
              <span className="label">Date & Time:</span>
              <span className="value">{formatDateTime(appointment.starts_at)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Duration:</span>
              <span className="value">{appointment.service.duration_minutes} minutes</span>
            </div>
            <div className="detail-row">
              <span className="label">Ends At:</span>
              <span className="value">{formatTime(appointment.ends_at)}</span>
            </div>
          </section>

          {/* Notes */}
          {appointment.notes && (
            <section className="section notes-section">
              <h2>Notes</h2>
              <div className="notes-content">{appointment.notes}</div>
            </section>
          )}

          {/* Actions */}
          {(canReschedule || canCancel) && (
            <section className="section actions-section">
              <h2>Actions</h2>
              <div className="action-buttons">
                {canReschedule && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowRescheduleForm(!showRescheduleForm)}
                  >
                    {showRescheduleForm ? 'Cancel Reschedule' : 'Reschedule Appointment'}
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowCancelConfirm(!showCancelConfirm)}
                  >
                    {showCancelConfirm ? 'Keep Appointment' : 'Cancel Appointment'}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Reschedule Form */}
          {showRescheduleForm && canReschedule && (
            <section className="section reschedule-section">
              <h3>Select New Date & Time</h3>
              <div className="form-group">
                <label htmlFor="reschedule-date">Date:</label>
                <input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={handleRescheduleDate}
                  min={today}
                />
              </div>

              {rescheduleDate && (
                <div className="time-slots">
                  {availableSlots.length > 0 ? (
                    <>
                      <p>Available Time Slots:</p>
                      <div className="slot-grid">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="no-slots">No available time slots for this date</p>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div className="reschedule-summary">
                  <h4>New Appointment Time:</h4>
                  <p>{formatDateTime(selectedSlot)}</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleRescheduleAppointment}
                    disabled={isRescheduling}
                  >
                    {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && canCancel && (
            <section className="section cancel-confirmation">
              <h3>Cancel Appointment?</h3>
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="confirmation-buttons">
                <button
                  className="btn btn-danger"
                  onClick={handleCancelAppointment}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isLoading}
                >
                  Keep Appointment
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentDetailsPage
