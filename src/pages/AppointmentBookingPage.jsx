import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAppointment, getAvailableSlots } from '../api/appointments'
import { getServicesBySalon } from '../api/services'
import { searchSalons } from '../api/salons'
import { getStaffBySalon } from '../api/staff'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './appointment-booking.css'

function AppointmentBookingPage() {
  const navigate = useNavigate()
  const { user, refreshActivity } = useAuth()

  // Form state
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [staff, setStaff] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Refresh activity on mount
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load shops on mount (get all published salons)
  useEffect(() => {
    loadShops()
  }, [])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await searchSalons({ limit: 100 })
      if (response.salons) {
        setShops(response.salons)
      }
    } catch (err) {
      setError(err.message || 'Failed to load salons')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopChange = async (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    if (shop) {
      setSelectedShop(shop)
      setSelectedService(null)
      setSelectedStaff(null)
      setAppointmentDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setError(null)

      // Load services and staff for this salon
      await Promise.all([loadServices(shopId), loadStaff(shopId)])
    }
  }

  const loadServices = async (salonId) => {
    try {
      const data = await getServicesBySalon(salonId)
      setServices(data)
    } catch (err) {
      setError(err.message || 'Failed to load services')
    }
  }

  const loadStaff = async (salonId) => {
    try {
      const data = await getStaffBySalon(salonId)
      setStaff(data)
    } catch (err) {
      setError(err.message || 'Failed to load staff')
    }
  }

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }

  const handleStaffChange = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId)
    if (staffMember) {
      setSelectedStaff(staffMember)
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }

  const handleDateChange = async (e) => {
    const date = e.target.value
    setAppointmentDate(date)
    setSelectedSlot(null)
    setAvailableSlots([])

    if (date && selectedStaff && selectedService) {
      await loadAvailableSlots(date)
    }
  }

  const loadAvailableSlots = async (date) => {
    try {
      setIsLoading(true)
      setError(null)
      const slots = await getAvailableSlots(
        selectedStaff.id,
        date,
        selectedService.duration_minutes
      )
      setAvailableSlots(slots)
    } catch (err) {
      setError(err.message || 'Failed to load available slots')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()

    if (!selectedShop || !selectedService || !selectedStaff || !selectedSlot) {
      setError('Please select all appointment details')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const appointmentData = {
        salon_id: selectedShop.id,
        staff_id: selectedStaff.id,
        service_id: selectedService.id,
        client_id: user.id,
        starts_at: selectedSlot,
        notes: notes.trim() || null,
      }

      await createAppointment(appointmentData)
      setSuccessMessage('Appointment booked successfully!')

      // Reset form
      setSelectedShop(null)
      setSelectedService(null)
      setSelectedStaff(null)
      setAppointmentDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setNotes('')

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/appointments')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to book appointment')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="appointment-booking-page">
      <Header />
      <div className="booking-container">
        <h1>Book an Appointment</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleBookAppointment} className="booking-form">
          {/* Step 1: Select Salon */}
          <div className="form-section">
            <h2>Step 1: Select Salon</h2>
            <div className="form-group">
              <label htmlFor="salon-select">Choose a Salon *</label>
              <select
                id="salon-select"
                value={selectedShop?.id || ''}
                onChange={(e) => handleShopChange(parseInt(e.target.value))}
                required
              >
                <option value="">-- Select a salon --</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedShop && (
            <>
              {/* Step 2: Select Service */}
              <div className="form-section">
                <h2>Step 2: Select Service</h2>
                <div className="form-group">
                  <label htmlFor="service-select">Service *</label>
                  <select
                    id="service-select"
                    value={selectedService?.id || ''}
                    onChange={(e) => handleServiceChange(parseInt(e.target.value))}
                    required
                  >
                    <option value="">-- Select a service --</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ${(service.price_cents / 100).toFixed(2)} ({service.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Select Staff */}
              <div className="form-section">
                <h2>Step 3: Select Staff Member</h2>
                <div className="form-group">
                  <label htmlFor="staff-select">Staff Member *</label>
                  <select
                    id="staff-select"
                    value={selectedStaff?.id || ''}
                    onChange={(e) => handleStaffChange(parseInt(e.target.value))}
                    required
                  >
                    <option value="">-- Select a staff member --</option>
                    {staff.map(staffMember => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.user?.name || 'Unknown'} - {staffMember.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Select Date & Time */}
              <div className="form-section">
                <h2>Step 4: Select Date & Time</h2>
                <div className="form-group">
                  <label htmlFor="date-select">Date *</label>
                  <input
                    id="date-select"
                    type="date"
                    value={appointmentDate}
                    onChange={handleDateChange}
                    min={today}
                    required
                  />
                </div>

                {appointmentDate && selectedStaff && selectedService && (
                  <div className="time-slots">
                    <label>Available Times *</label>
                    {isLoading && <p className="loading">Loading available times...</p>}
                    {!isLoading && availableSlots.length === 0 && (
                      <p className="no-slots">No available time slots for this date</p>
                    )}
                    {!isLoading && availableSlots.length > 0 && (
                      <div className="slot-grid">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-section">
                <h2>Additional Notes (Optional)</h2>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes for the appointment..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Summary */}
              {selectedService && selectedStaff && selectedSlot && (
                <div className="appointment-summary">
                  <h3>Appointment Summary</h3>
                  <div className="summary-item">
                    <strong>Service:</strong> {selectedService.name}
                  </div>
                  <div className="summary-item">
                    <strong>Staff:</strong> {selectedStaff.user?.name || 'Unknown'}
                  </div>
                  <div className="summary-item">
                    <strong>Date & Time:</strong> {new Date(selectedSlot).toLocaleString()}
                  </div>
                  <div className="summary-item">
                    <strong>Duration:</strong> {selectedService.duration_minutes} minutes
                  </div>
                  <div className="summary-item">
                    <strong>Price:</strong> ${(selectedService.price_cents / 100).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={!selectedService || !selectedStaff || !selectedSlot || isLoading}
              >
                {isLoading ? 'Booking...' : 'Book Appointment'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default AppointmentBookingPage
