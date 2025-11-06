import { apiBaseURL } from './http';

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
