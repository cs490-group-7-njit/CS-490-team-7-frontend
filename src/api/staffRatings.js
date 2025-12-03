import { get, post } from './http'

/**
 * Rate a staff member
 * @param {number} staffId - The ID of the staff member
 * @param {number} clientId - The ID of the client
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>}
 */
export async function rateStaff(staffId, clientId, rating, comment = '') {
  return post(
    `/staff/${staffId}/rate`,
    { client_id: clientId, rating, comment },
    { credentials: 'include' }
  )
}

/**
 * Get reviews for a staff member
 * @param {number} staffId - The ID of the staff member
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Results per page (default 20)
 * @returns {Promise<Object>}
 */
export async function getStaffReviews(staffId, page = 1, limit = 20) {
  return get(
    `/staff/${staffId}/reviews?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  )
}

/**
 * Get average rating for a staff member
 * @param {number} staffId - The ID of the staff member
 * @returns {Promise<Object>}
 */
export async function getStaffRating(staffId) {
  return get(`/staff/${staffId}/rating`, { credentials: 'include' })
}
