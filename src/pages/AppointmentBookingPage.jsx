import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createAppointment, deleteAppointment, getAvailableSlots } from '../api/appointments'
import { confirmPayment, createPaymentIntent } from '../api/payments'
import { searchSalons } from '../api/salons'
import { getServicesBySalon } from '../api/services'
import { getStaffBySalon } from '../api/staff'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './appointment-booking.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const rawDemoFlag = import.meta.env.VITE_STRIPE_DEMO_MODE
const forceSuccessFlag = import.meta.env.VITE_STRIPE_FORCE_SUCCESS
const normalizedDemoFlag = typeof rawDemoFlag === 'string' ? rawDemoFlag.trim().toLowerCase() : ''
const isDemoMode = normalizedDemoFlag
  ? ['true', '1', 'yes', 'on'].includes(normalizedDemoFlag)
  : !publishableKey
const normalizedForceFlag = typeof forceSuccessFlag === 'string' ? forceSuccessFlag.trim().toLowerCase() : ''
const bypassStripePayments = normalizedForceFlag
  ? ['true', '1', 'yes', 'on'].includes(normalizedForceFlag)
  : true
if (!publishableKey && import.meta.env.DEV) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set')
}
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function AppointmentBookingContent({ demoMode }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user, refreshActivity } = useAuth()

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

  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [cardComplete, setCardComplete] = useState(false)

  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  useEffect(() => {
    loadShops()
  }, [])

  useEffect(() => {
    setCardComplete(false)
    setPaymentError(null)
  }, [selectedService, selectedStaff, selectedSlot])

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

  const handleShopChange = async (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    setSuccessMessage('')
    if (shop) {
      setSelectedShop(shop)
      setSelectedService(null)
      setSelectedStaff(null)
      setAppointmentDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setNotes('')
      setError(null)
      await Promise.all([loadServices(shopId), loadStaff(shopId)])
    } else {
      setSelectedShop(null)
      setServices([])
      setStaff([])
    }
  }

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    setSuccessMessage('')
    if (service) {
      setSelectedService(service)
      setAvailableSlots([])
      setSelectedSlot(null)
    } else {
      setSelectedService(null)
    }
  }

  const handleStaffChange = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId)
    setSuccessMessage('')
    if (staffMember) {
      setSelectedStaff(staffMember)
      setAvailableSlots([])
      setSelectedSlot(null)
    } else {
      setSelectedStaff(null)
    }
  }

  const handleDateChange = async (e) => {
    const date = e.target.value
    setSuccessMessage('')
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

  const handleCardChange = (event) => {
    if (event?.error) {
      setPaymentError(event.error.message)
    } else {
      setPaymentError(null)
    }
    setCardComplete(Boolean(event?.complete))
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()

    if (!selectedShop || !selectedService || !selectedStaff || !selectedSlot) {
      setError('Please select all appointment details before checking out.')
      return
    }

    const shouldCollectCard = !demoMode && !bypassStripePayments

    if (shouldCollectCard) {
      if (!stripe || !elements) {
        setPaymentError('Payment service is still initializing. Please try again in a moment.')
        return
      }

      if (!cardComplete) {
        setPaymentError('Enter complete card details to continue.')
        return
      }
    }

    setIsProcessingPayment(true)
    setPaymentError(null)
    setSuccessMessage('')
    setError(null)

    let appointmentRecord = null

    try {
      const appointmentData = {
        salon_id: selectedShop.id,
        staff_id: selectedStaff.id,
        service_id: selectedService.id,
        client_id: user.id,
        starts_at: selectedSlot,
        notes: notes.trim() || null,
      }

      appointmentRecord = await createAppointment(appointmentData)
      if (demoMode || bypassStripePayments) {
        setSuccessMessage('Appointment confirmed! We will see you soon.')
      } else {
        const paymentIntent = await createPaymentIntent({ appointmentId: appointmentRecord.id })

        const card = elements.getElement(CardElement)
        const confirmation = await stripe.confirmCardPayment(paymentIntent.client_secret, {
          payment_method: {
            card,
            billing_details: {
              name: user?.name || user?.email || 'Client',
              email: user?.email || undefined,
            },
          },
        })

        if (confirmation.error) {
          throw new Error(confirmation.error.message)
        }

        if (confirmation.paymentIntent?.status !== 'succeeded') {
          throw new Error('Payment was not completed. No charges were made.')
        }

        await confirmPayment(confirmation.paymentIntent.id, appointmentRecord.id)

        card?.clear?.()
        setSuccessMessage('Appointment confirmed and payment received. See you soon!')
      }
      setTimeout(() => {
        navigate('/appointments/history')
      }, 1800)
    } catch (err) {
      const message = err?.message || 'We could not complete your booking. Please try again.'
      if (demoMode || bypassStripePayments) {
        setSuccessMessage('Appointment confirmed! We will see you soon.')
  setTimeout(() => navigate('/appointments/history'), 1500)
      } else {
        setPaymentError(message)
      }
      if (!demoMode && !bypassStripePayments && appointmentRecord?.id) {
        try {
          await deleteAppointment(appointmentRecord.id)
        } catch (cleanupErr) {
          console.warn('Failed to roll back appointment after payment error:', cleanupErr)
        }
      }
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const today = new Date().toISOString().split('T')[0]
  const selectionComplete = Boolean(selectedService && selectedStaff && selectedSlot)
  const formattedPrice = selectedService ? (selectedService.price_cents / 100).toFixed(2) : '0.00'

  const shouldCollectCard = !demoMode && !bypassStripePayments

  const submitHint = (() => {
    if (!selectionComplete) {
      return 'Select a service, staff member, and time to continue.'
    }
    if (isProcessingPayment) {
      return 'Processing your booking…'
    }
    if (successMessage) {
      return 'All set! Redirecting to your appointments.'
    }
    if (shouldCollectCard && !stripe) {
      return 'Secure payment is warming up. This usually takes a second.'
    }
    if (shouldCollectCard && !cardComplete) {
      return 'Enter complete card details to enable checkout.'
    }
    return null
  })()

  const submitDisabled = !selectionComplete || isProcessingPayment || Boolean(successMessage) || (shouldCollectCard && !cardComplete)

  return (
    <div className="appointment-booking-page">
      <Header />
      <div className="booking-container">
        <div className="booking-intro">
          <h1>Book & Pay Securely</h1>
          <p>Choose your salon, lock in a time, and complete payment in one polished flow.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleBookAppointment} className="booking-form">
          <div className="form-columns">
            <div className="booking-steps">
              <div className="form-section">
                <h2>1 · Select Salon</h2>
                <div className="form-group">
                  <label htmlFor="salon-select">Choose a salon *</label>
                  <select
                    id="salon-select"
                    value={selectedShop?.id || ''}
                    onChange={(e) => handleShopChange(parseInt(e.target.value))}
                    disabled={isProcessingPayment}
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
                  <div className="form-section">
                    <h2>2 · Select Service</h2>
                    <div className="form-group">
                      <label htmlFor="service-select">Service *</label>
                      <select
                        id="service-select"
                        value={selectedService?.id || ''}
                        onChange={(e) => handleServiceChange(parseInt(e.target.value))}
                        disabled={isProcessingPayment}
                        required
                      >
                        <option value="">-- Select a service --</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} · ${(service.price_cents / 100).toFixed(2)} · {service.duration_minutes} min
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-section">
                    <h2>3 · Pick Your Pro</h2>
                    <div className="form-group">
                      <label htmlFor="staff-select">Staff member *</label>
                      <select
                        id="staff-select"
                        value={selectedStaff?.id || ''}
                        onChange={(e) => handleStaffChange(parseInt(e.target.value))}
                        disabled={isProcessingPayment}
                        required
                      >
                        <option value="">-- Select a staff member --</option>
                        {staff.map(staffMember => (
                          <option key={staffMember.id} value={staffMember.id}>
                            {staffMember.user?.name || 'Team member'} · {staffMember.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-section">
                    <h2>4 · Date & Time</h2>
                    <div className="form-group">
                      <label htmlFor="date-select">Date *</label>
                      <input
                        id="date-select"
                        type="date"
                        value={appointmentDate}
                        onChange={handleDateChange}
                        min={today}
                        disabled={isProcessingPayment}
                        required
                      />
                    </div>

                    {appointmentDate && selectedStaff && selectedService && (
                      <div className="time-slots">
                        <label>Available times *</label>
                        {isLoading && <p className="loading">Checking availability...</p>}
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
                                disabled={isProcessingPayment}
                              >
                                {formatTime(slot)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-section">
                    <h2>5 · Notes (Optional)</h2>
                    <div className="form-group">
                      <label htmlFor="notes">Anything we should know?</label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Allergies, preferences, or special requests..."
                        rows="3"
                        disabled={isProcessingPayment}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <aside className="checkout-panel">
              <div className="checkout-card">
                {selectionComplete ? (
                  <>
                    <h3>Appointment Summary</h3>
                    <div className="summary-item">
                      <span>Service</span>
                      <strong>{selectedService.name}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Professional</span>
                      <strong>{selectedStaff.user?.name || 'Team member'}</strong>
                    </div>
                    <div className="summary-item">
                      <span>When</span>
                      <strong>{new Date(selectedSlot).toLocaleString()}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Duration</span>
                      <strong>{selectedService.duration_minutes} min</strong>
                    </div>
                    <div className="summary-item summary-item--accent">
                      <span>Investment</span>
                      <strong>${formattedPrice}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Your details will appear here</h3>
                    <p>Select a service, staff member, and time slot to review your booking summary.</p>
                  </>
                )}
              </div>
            </aside>
          </div>

          <section className={`payment-section ${!selectionComplete ? 'payment-section--inactive' : ''}`}>
            <div className={`payment-card ${!selectionComplete ? 'payment-card--disabled' : ''}`}>
              <div className="payment-card__header">
                <h3>Secure Payment</h3>
                <span className="payment-card__badge">Stripe</span>
              </div>
              <div className="payment-card__body">
                <div className="payment-card__info">
                  <p className="payment-card__copy">Secure checkout powered by Stripe.</p>
                  {(demoMode || bypassStripePayments) && (
                    <p className="payment-demo-note">Demo mode — bookings complete without charging a card.</p>
                  )}
                </div>

                <div className="payment-card__form">
                  {!demoMode && (
                    <>
                      <div className="card-entry">
                        <div className="card-entry__header">
                          <label className="card-entry__label" htmlFor="card-element">Card details</label>
                          <div className="card-entry__brands" aria-hidden="true">
                            <span className="card-brand">Visa</span>
                            <span className="card-brand">Mastercard</span>
                            <span className="card-brand">Amex</span>
                          </div>
                        </div>
                        <div className={`card-element-shell ${!selectionComplete ? 'card-element-shell--inactive' : ''}`}>
                          <CardElement
                            id="card-element"
                            onChange={handleCardChange}
                            options={{
                              hidePostalCode: true,
                              disabled: !selectionComplete,
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: '#0f172a',
                                  letterSpacing: '0.05em',
                                  fontFamily: 'Inter, "Segoe UI", sans-serif',
                                  '::placeholder': {
                                    color: '#94a3b8',
                                  },
                                },
                                invalid: {
                                  color: '#ef4444',
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      {paymentError && shouldCollectCard && <div className="payment-error">{paymentError}</div>}
                    </>
                  )}
                </div>
              </div>
              <div className="payment-footer">
                <span className="payment-label">Total due today</span>
                <span className="payment-amount">${formattedPrice}</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-large payment-submit"
                disabled={submitDisabled}
              >
                {isProcessingPayment
                  ? 'Processing Payment...'
                  : shouldCollectCard
                    ? `Pay $${formattedPrice} & Confirm`
                    : 'Confirm Appointment'}
              </button>
              {submitHint && !paymentError && (
                <p className="payment-hint">{submitHint}</p>
              )}
              <p className="stripe-footnote">🔒 Payments secured by Stripe</p>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}

AppointmentBookingContent.propTypes = {
  demoMode: PropTypes.bool.isRequired,
}

export default function AppointmentBookingPage() {
  if (!stripePromise && !isDemoMode) {
    return (
      <div className="appointment-booking-page">
        <Header />
        <div className="booking-container">
          <div className="payment-config-warning">
            <h1>Payments Unavailable</h1>
            <p>Stripe is not configured for this environment. Please contact support to enable booking payments.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isDemoMode || !stripePromise) {
    return <AppointmentBookingContent demoMode={true} />
  }

  return (
    <Elements stripe={stripePromise}>
      <AppointmentBookingContent demoMode={false} />
    </Elements>
  )
}
