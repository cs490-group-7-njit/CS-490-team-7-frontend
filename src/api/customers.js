import { get } from './http'

/**
 * Get all customers for a salon with their visit history
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>}
 */
export async function getSalonCustomers(salonId) {
  try {
    const response = await get(`/salons/${salonId}/customers`)
    return response
  } catch (error) {
    console.error('Error fetching salon customers:', error)
    throw error
  }
}

/**
 * Get detailed visit history for a specific customer
 * @param {number} salonId - The salon ID
 * @param {number} clientId - The client ID
 * @returns {Promise<Object>}
 */
export async function getCustomerVisitHistory(salonId, clientId) {
  try {
    const response = await get(`/salons/${salonId}/customers/${clientId}/history`)
    return response
  } catch (error) {
    console.error('Error fetching customer visit history:', error)
    throw error
  }
}

/**
 * Get customer statistics for a salon
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>}
 */
export async function getCustomerStatistics(salonId) {
  try {
    const response = await get(`/salons/${salonId}/customers/stats`)
    return response
  } catch (error) {
    console.error('Error fetching customer statistics:', error)
    throw error
  }
}
