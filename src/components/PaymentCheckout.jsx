import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPayment } from '../api/payments'
import '../pages/payment-tracking.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(publishableKey)

function CheckoutForm({ amountCents, salonId, appointmentId, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [clientSecret, setClientSecret] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (!amountCents || amountCents <= 0) return
        const res = await createPaymentIntent({ amount_cents: amountCents, salon_id: salonId, appointment_id: appointmentId })
        setClientSecret(res.client_secret)
      } catch (err) {
        setError(err.message || 'Failed to prepare payment')
      }
    }
    init()
  }, [amountCents, salonId, appointmentId])

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
        // Notify backend (optional if using webhooks)
        try {
          await confirmPayment(result.paymentIntent.id)
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

  if (!amountCents || amountCents <= 0) {
    return <div className="error">Invalid amount. Please provide a positive amount to pay.</div>
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group">
        <label>Amount</label>
        <div className="amount">${(amountCents / 100).toFixed(2)}</div>
      </div>

      <div className="form-group">
        <label>Card details</label>
        <div className="card-element-wrapper">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="form-actions">
        <button type="submit" disabled={!stripe || loading}>{loading ? 'Processing...' : 'Pay Online'}</button>
      </div>
    </form>
  )
}

export default function PaymentCheckoutWrapper() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const salonId = searchParams.get('salonId')
  const appointmentId = searchParams.get('appointmentId')
  const amountParam = searchParams.get('amountCents')
  const [amountCents, setAmountCents] = useState(amountParam ? parseInt(amountParam, 10) : 0)
  const [manualAmount, setManualAmount] = useState('')

  const handleSuccess = (paymentIntent) => {
    // navigate to messages or payment history
    navigate('/payment-history')
  }

  const startWithManual = () => {
    const dollars = parseFloat(manualAmount)
    if (isNaN(dollars) || dollars <= 0) return alert('Enter a valid amount')
    setAmountCents(Math.round(dollars * 100))
  }

  return (
    <div className="page payment-page">
      <div className="page-content">
        <h1>Pay Online</h1>

        {amountCents > 0 ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm amountCents={amountCents} salonId={salonId} appointmentId={appointmentId} onSuccess={handleSuccess} />
          </Elements>
        ) : (
          <div className="manual-amount">
            <p>No amount specified. Enter amount to pay (USD):</p>
            <input type="number" step="0.01" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder="25.00" />
            <div style={{ marginTop: 8 }}>
              <button onClick={startWithManual}>Start Payment</button>
              <button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
