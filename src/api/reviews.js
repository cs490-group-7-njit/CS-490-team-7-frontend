import { del, get, post, put } from './http'

/**
 * Get all reviews for a salon with average rating (UC 2.8)
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>} Reviews list with average rating and total count
 */
export const getSalonReviews = async (salonId) => {
  try {
    const response = await get(`/salons/${salonId}/reviews`)
    return response
  } catch (error) {
    console.error(`Error fetching reviews for salon ${salonId}:`, error)
    throw error
  }
}

/**
 * Create a new review for a salon (UC 2.8)
 * @param {number} salonId - The salon ID
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.client_id - Client user ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.comment - Review comment text
 * @returns {Promise<Object>} Created review object
 */
export const postReview = async (salonId, reviewData) => {
  try {
    const response = await post(`/salons/${salonId}/reviews`, reviewData)
    return response
  } catch (error) {
    console.error(`Error creating review for salon ${salonId}:`, error)
    throw error
  }
}

/**
 * Update an existing review (UC 2.8)
 * @param {number} reviewId - The review ID
 * @param {Object} updateData - Data to update (rating and/or comment)
 * @returns {Promise<Object>} Updated review object
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    const response = await put(`/reviews/${reviewId}`, updateData)
    return response
  } catch (error) {
    console.error(`Error updating review ${reviewId}:`, error)
    throw error
  }
}

/**
 * Delete a review (UC 2.8)
 * @param {number} reviewId - The review ID
 * @returns {Promise<Object>} Confirmation message
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await del(`/reviews/${reviewId}`)
    return response
  } catch (error) {
    console.error(`Error deleting review ${reviewId}:`, error)
    throw error
  }
}
