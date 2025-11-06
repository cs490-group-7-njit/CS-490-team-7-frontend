import { del, get, post, put } from './http'

/**
 * Get all reviews for a salon with filtering, sorting, and pagination (UC 2.9)
 * @param {number} salonId - The salon ID
 * @param {string} queryString - Optional query string with filters (sort_by, order, min_rating, limit, offset)
 * @returns {Promise<Object>} Reviews list with average rating, total count, and pagination info
 */
export const getSalonReviews = async (salonId, queryString = '') => {
  try {
    const url = queryString
      ? `/salons/${salonId}/reviews?${queryString}`
      : `/salons/${salonId}/reviews`
    const response = await get(url)
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

/**
 * Add a vendor reply to a review (UC 1.11)
 * @param {number} reviewId - The review ID
 * @param {Object} replyData - Reply data
 * @param {string} replyData.vendor_reply - Vendor's reply text
 * @param {number} replyData.vendor_id - Vendor user ID (optional, for authorization)
 * @returns {Promise<Object>} Updated review object with reply
 */
export const addVendorReply = async (reviewId, replyData) => {
  try {
    const response = await post(`/reviews/${reviewId}/reply`, replyData)
    return response
  } catch (error) {
    console.error(`Error adding vendor reply to review ${reviewId}:`, error)
    throw error
  }
}

/**
 * Update a vendor reply to a review (UC 1.11)
 * @param {number} reviewId - The review ID
 * @param {Object} replyData - Reply data
 * @param {string} replyData.vendor_reply - Updated vendor reply text
 * @param {number} replyData.vendor_id - Vendor user ID (optional, for authorization)
 * @returns {Promise<Object>} Updated review object
 */
export const updateVendorReply = async (reviewId, replyData) => {
  try {
    const response = await put(`/reviews/${reviewId}/reply`, replyData)
    return response
  } catch (error) {
    console.error(`Error updating vendor reply to review ${reviewId}:`, error)
    throw error
  }
}

/**
 * Delete a vendor reply from a review (UC 1.11)
 * @param {number} reviewId - The review ID
 * @param {number} vendorId - Vendor user ID (optional, for authorization)
 * @returns {Promise<Object>} Updated review object with reply removed
 */
export const deleteVendorReply = async (reviewId, vendorId = null) => {
  try {
    let url = `/reviews/${reviewId}/reply`
    if (vendorId) {
      url += `?vendor_id=${vendorId}`
    }
    const response = await del(url)
    return response
  } catch (error) {
    console.error(`Error deleting vendor reply from review ${reviewId}:`, error)
    throw error
  }
}

/**
 * Get reviews with vendor replies for a salon (UC 1.11)
 * @param {number} salonId - The salon ID
 * @param {boolean} withRepliesOnly - If true, only return reviews with vendor replies
 * @param {number} limit - Max reviews to return (default: 50)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise<Object>} Reviews with replies and pagination info
 */
export const getSalonReviewsWithReplies = async (salonId, withRepliesOnly = false, limit = 50, offset = 0) => {
  try {
    let url = `/salons/${salonId}/reviews-with-replies?limit=${limit}&offset=${offset}`
    if (withRepliesOnly) {
      url += '&with_replies_only=true'
    }
    const response = await get(url)
    return response
  } catch (error) {
    console.error(`Error fetching reviews with replies for salon ${salonId}:`, error)
    throw error
  }
}

