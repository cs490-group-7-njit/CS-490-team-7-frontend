import { del, get, post, put } from './http'

/**
 * Get all payment methods for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>}
 */
export async function getPaymentMethods(userId) {
  return get(`/users/${userId}/payment-methods`, { credentials: 'include' })
}

/**
 * Add a new payment method
 * @param {number} userId - The user ID
 * @param {Object} paymentData - Card details
 * @returns {Promise<Object>}
 */
export async function addPaymentMethod(userId, paymentData) {
  return post(
    `/users/${userId}/payment-methods`,
    paymentData,
    { credentials: 'include' }
  )
}

/**
 * Delete a payment method
 * @param {number} userId - The user ID
 * @param {number} paymentMethodId - The payment method ID
 * @returns {Promise<Object>}
 */
export async function deletePaymentMethod(userId, paymentMethodId) {
  return del(
    `/users/${userId}/payment-methods/${paymentMethodId}`,
    { credentials: 'include' }
  )
}

/**
 * Set a payment method as default
 * @param {number} userId - The user ID
 * @param {number} paymentMethodId - The payment method ID
 * @returns {Promise<Object>}
 */
export async function setDefaultPaymentMethod(userId, paymentMethodId) {
  return put(
    `/users/${userId}/payment-methods/${paymentMethodId}/default`,
    undefined,
    { credentials: 'include' }
  )
}

/**
 * Get transaction history for a user
 * @param {number} userId - The user ID
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Results per page (default 20)
 * @returns {Promise<Object>}
 */
export async function getTransactions(userId, page = 1, limit = 20) {
  return get(
    `/users/${userId}/transactions?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  )
}

/**
 * Create a transaction record
 * @param {number} userId - The user ID
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>}
 */
export async function createTransaction(userId, transactionData) {
  return post(
    `/users/${userId}/transactions`,
    transactionData,
    { credentials: 'include' }
  )
}

/**
 * UC 1.15: Payment Tracking API functions
 */

/**
 * Get all payments for a salon
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>} Object containing payments and revenue summary
 */
export async function getSalonPayments(salonId) {
  try {
    const response = await get(`/salons/${salonId}/payments`)
    return response
  } catch (error) {
    console.error('Error fetching salon payments:', error)
    throw error
  }
}

/**
 * Get payment statistics for a salon
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>} Object containing payment statistics and analytics
 */
export async function getSalonPaymentStats(salonId) {
  try {
    const response = await get(`/salons/${salonId}/payments/stats`)
    return response
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    throw error
  }
}

/**
 * Get payments for a specific date
 * @param {number} salonId - The salon ID
 * @param {string} date - Date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Object>} Object containing payments for the specified date
 */
export async function getSalonPaymentsByDate(salonId, date) {
  try {
    const response = await get(`/salons/${salonId}/payments/${date}`)
    return response
  } catch (error) {
    console.error('Error fetching payments for date:', error)
    throw error
  }
}

/**
 * Create a Stripe PaymentIntent via backend
 * Backend route: POST /create-payment-intent
 * body: { appointment_id } OR { service_id }
 * @param {Object} params - Parameters object
 * @param {number|null} params.appointmentId - The appointment ID
 * @param {number|null} params.serviceId - The service ID
 * @returns {Promise<{client_secret: string, payment_intent_id: string, amount_cents?: number}>} Resolves with Stripe PaymentIntent details
 */
export async function createPaymentIntent({ appointmentId = null, serviceId = null }) {
  const payload = {};
  if (appointmentId) payload.appointment_id = appointmentId;
  if (serviceId) payload.service_id = serviceId;
  return post('/create-payment-intent', payload);
}

/**
 * Confirm payment and record transaction
 * Backend route: POST /confirm-payment
 * body: { payment_intent_id, appointment_id }
 * @param {string} paymentIntentId - The Stripe payment intent ID
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Resolves with confirmation result
 */
export async function confirmPayment(paymentIntentId, appointmentId) {
  return post('/confirm-payment', {
    payment_intent_id: paymentIntentId,
    appointment_id: appointmentId
  });
}
