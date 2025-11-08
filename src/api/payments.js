import { apiBaseURL } from './http';
import { get } from './http'

/**
 * Get all payment methods for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>}
 */
export async function getPaymentMethods(userId) {
  const response = await fetch(`${apiBaseURL}/users/${userId}/payment-methods`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch payment methods');
  return response.json();
}

/**
 * Add a new payment method
 * @param {number} userId - The user ID
 * @param {Object} paymentData - Card details
 * @returns {Promise<Object>}
 */
export async function addPaymentMethod(userId, paymentData) {
  const response = await fetch(`${apiBaseURL}/users/${userId}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) throw new Error('Failed to add payment method');
  return response.json();
}

/**
 * Delete a payment method
 * @param {number} userId - The user ID
 * @param {number} paymentMethodId - The payment method ID
 * @returns {Promise<Object>}
 */
export async function deletePaymentMethod(userId, paymentMethodId) {
  const response = await fetch(
    `${apiBaseURL}/users/${userId}/payment-methods/${paymentMethodId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to delete payment method');
  return response.json();
}

/**
 * Set a payment method as default
 * @param {number} userId - The user ID
 * @param {number} paymentMethodId - The payment method ID
 * @returns {Promise<Object>}
 */
export async function setDefaultPaymentMethod(userId, paymentMethodId) {
  const response = await fetch(
    `${apiBaseURL}/users/${userId}/payment-methods/${paymentMethodId}/default`,
    {
      method: 'PUT',
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to set default payment method');
  return response.json();
}

/**
 * Get transaction history for a user
 * @param {number} userId - The user ID
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Results per page (default 20)
 * @returns {Promise<Object>}
 */
export async function getTransactions(userId, page = 1, limit = 20) {
  const response = await fetch(
    `${apiBaseURL}/users/${userId}/transactions?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

/**
 * Create a transaction record
 * @param {number} userId - The user ID
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>}
 */
export async function createTransaction(userId, transactionData) {
  const response = await fetch(`${apiBaseURL}/users/${userId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(transactionData),
  });
  if (!response.ok) throw new Error('Failed to create transaction');
  return response.json();
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
