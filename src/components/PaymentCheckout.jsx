import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPayment } from '../api/payments'
import '../pages/payment-tracking.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
if (!publishableKey) {
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

  useEffect(() => {
    const init = async () => {
      try {
        if (!appointmentId && !serviceId) {
          setError('An appointment or service is required to process payment')
          return
        }
        const res = await createPaymentIntent({ appointment_id: appointmentId, service_id: serviceId })
        setClientSecret(res.client_secret)
        // Backend may return amount info - if not, we show "amount pending"
        if (res.amount_cents) {
          setAmountCents(res.amount_cents)
        }
      } catch (err) {
        setError(err.message || 'Failed to prepare payment')
      }
    }
    init()
  }, [appointmentId, serviceId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const card = elements.getElement(CardElement)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      })
      if (result.error) {
        setError(result.error.message)
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Notify backend to record the transaction
        try {
          await confirmPayment(result.paymentIntent.id, appointmentId)
        } catch (err) {
          // swallow - webhook should be source of truth
          console.warn('confirmPayment failed:', err.message)
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
        <button type="submit" disabled={!stripe || loading || !clientSecret}>{loading ? 'Processing...' : 'Pay Online'}</button>
      </div>
    </form>
  )
}

export default function PaymentCheckoutWrapper() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appointmentId = searchParams.get('appointmentId')
  const serviceId = searchParams.get('serviceId')

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
          <div className="error">Payment system is not configured. Please contact support.</div>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Go Back</button>
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
          <button onClick={() => navigate('/appointments')} style={{ marginTop: 16 }}>Book Appointment</button>
          <button onClick={() => navigate(-1)} style={{ marginLeft: 8, marginTop: 16 }}>Go Back</button>
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
            appointmentId={appointmentId ? parseInt(appointmentId, 10) : null} 
            serviceId={serviceId ? parseInt(serviceId, 10) : null} 
            onSuccess={handleSuccess} 
          />
        </Elements>
      </div>
    </div>
  )
}
