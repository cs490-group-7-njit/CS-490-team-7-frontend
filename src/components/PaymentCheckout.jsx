import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPayment } from '../api/payments'
import '../pages/payment-tracking.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
if (!publishableKey && import.meta.env.DEV) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set')
}
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function CheckoutForm({ appointmentId, serviceId, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [clientSecret, setClientSecret] = useState(null)
  const [amountCents, setAmountCents] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Remove payment intent creation from useEffect. Instead, defer to handleSubmit.
  useEffect(() => {
    // Optionally, reset state when appointmentId or serviceId changes
    setClientSecret(null)
    setAmountCents(0)
    setError(null)
  }, [appointmentId, serviceId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!stripe || !elements) {
      setError('Payment system is not ready. Please try again in a moment.')
      return
    }
    setLoading(true)
    try {
      let secret = clientSecret
      if (!secret) {
        // Create payment intent only if not already created
        if (!appointmentId && !serviceId) {
          setError('An appointment or service is required to process payment')
          setLoading(false)
          return
        }
        const res = await createPaymentIntent({ appointmentId, serviceId })
        secret = res.client_secret
        setClientSecret(secret)
        if (res.amount_cents) {
          amount = res.amount_cents
          setAmountCents(amount)
        }
      }
      const card = elements.getElement(CardElement)
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: { card },
      })
      if (result.error) {
        setError(result.error.message)
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Notify backend to record the transaction (only if we have an appointment)
        if (appointmentId) {
          try {
            await confirmPayment(result.paymentIntent.id, appointmentId)
          } catch (err) {
            // Show a non-blocking warning to user and store paymentIntentId for potential retry
            console.warn('confirmPayment failed:', err.message)
            setError('Payment succeeded but could not be fully recorded. Please try again or provide this code for reference: ' + result.paymentIntent.id)
            try {
              window.sessionStorage.setItem('pendingPaymentIntentId', result.paymentIntent.id)
            } catch (storageErr) {
              console.warn('Failed to store paymentIntentId in sessionStorage:', storageErr)
            }
            return
          }
        onSuccess && onSuccess(result.paymentIntent)
      } else {
        setError('Payment failed or was not completed')
      }
    } catch (err) {
      setError(err.message || 'Payment error')
    } finally {
      setLoading(false)
    }
  }

  if (!clientSecret && !error) {
    return <div className="loading">Preparing payment...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      {amountCents > 0 && (
        <div className="form-group">
          <label>Amount</label>
          <div className="amount">${(amountCents / 100).toFixed(2)}</div>
        </div>
      )}

      <div className="form-group">
        <label>Card details</label>
        <div className="card-element-wrapper">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="form-actions">
        <button
          type="submit"
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : 'Pay Online'}
        </button>
      </div>
    </form>
  )
}

export default function PaymentCheckoutWrapper() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appointmentIdParam = searchParams.get('appointmentId')
  const serviceIdParam = searchParams.get('serviceId')

  // Parse and validate IDs
  const appointmentId = appointmentIdParam ? parseInt(appointmentIdParam, 10) : null
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : null

  const handleSuccess = () => {
    // navigate to payment history after successful payment
    navigate('/payment-history')
  }

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="page payment-page">
        <div className="page-content">
          <h1>Pay Online</h1>
          <div className="error">Payment system is not configured. Please try again later.</div>
          <button onClick={() => navigate(-1)} className="btn-back">Go Back</button>
        </div>
      </div>
    )
  }

  // Validate that IDs are valid positive integers
  const isValidId = (id) => Number.isInteger(id) && id > 0
  if ((appointmentIdParam && !isValidId(appointmentId)) || (serviceIdParam && !isValidId(serviceId))) {
    return (
      <div className="page payment-page">
        <div className="page-content">
          <h1>Pay Online</h1>
          <div className="error">Invalid appointment or service ID provided.</div>
          <button onClick={() => navigate(-1)} className="btn-back">Go Back</button>
        </div>
      </div>
    )
  }

  // Require appointment or service to process payment
  if (!appointmentId && !serviceId) {
    return (
      <div className="page payment-page">
        <div className="page-content">
          <h1>Pay Online</h1>
          <div className="error">An appointment or service is required to process payment. Please book an appointment first.</div>
          <button onClick={() => navigate('/appointments')} className="btn-book">Book Appointment</button>
          <button onClick={() => navigate(-1)} className="btn-back">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page payment-page">
      <div className="page-content">
        <h1>Pay Online</h1>

        <Elements stripe={stripePromise}>
          <CheckoutForm 
            appointmentId={appointmentId} 
            serviceId={serviceId} 
            onSuccess={handleSuccess} 
          />
        </Elements>
      </div>
    </div>
  )
}
