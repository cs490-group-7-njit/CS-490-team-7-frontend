import { del, get, post, put } from './http'

/**
 * Create a new promotion
 * @param {number} salonId - The salon ID
 * @param {Object} promotionData - Promotion details
 * @returns {Promise<Object>}
 */
export async function createPromotion(salonId, promotionData) {
  try {
    const response = await post(`/salons/${salonId}/promotions`, promotionData)
    return response
  } catch (error) {
    console.error('Error creating promotion:', error)
    throw error
  }
}

/**
 * Get all promotions for a salon
 * @param {number} salonId - The salon ID
 * @param {string} status - Optional filter by status
 * @returns {Promise<Object>}
 */
export async function getSalonPromotions(salonId, status = null) {
  try {
    let url = `/salons/${salonId}/promotions`
    if (status) {
      url += `?status=${status}`
    }
    const response = await get(url)
    return response
  } catch (error) {
    console.error('Error fetching promotions:', error)
    throw error
  }
}

/**
 * Update a promotion
 * @param {number} salonId - The salon ID
 * @param {string} promotionId - The promotion ID
 * @param {Object} updateData - Updated promotion data
 * @returns {Promise<Object>}
 */
export async function updatePromotion(salonId, promotionId, updateData) {
  try {
    const response = await put(
      `/salons/${salonId}/promotions/${promotionId}`,
      updateData
    )
    return response
  } catch (error) {
    console.error('Error updating promotion:', error)
    throw error
  }
}

/**
 * Delete a promotion
 * @param {number} salonId - The salon ID
 * @param {string} promotionId - The promotion ID
 * @returns {Promise<Object>}
 */
export async function deletePromotion(salonId, promotionId) {
  try {
    const response = await del(`/salons/${salonId}/promotions/${promotionId}`)
    return response
  } catch (error) {
    console.error('Error deleting promotion:', error)
    throw error
  }
}

/**
 * Send a promotion to targeted customers
 * @param {number} salonId - The salon ID
 * @param {string} promotionId - The promotion ID
 * @returns {Promise<Object>}
 */
export async function sendPromotion(salonId, promotionId) {
  try {
    const response = await post(
      `/salons/${salonId}/promotions/${promotionId}/send`,
      {}
    )
    return response
  } catch (error) {
    console.error('Error sending promotion:', error)
    throw error
  }
}

/**
 * Get promotion statistics for a salon
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>}
 */
export async function getPromotionStats(salonId) {
  try {
    const response = await get(`/salons/${salonId}/promotions/stats`)
    return response
  } catch (error) {
    console.error('Error fetching promotion stats:', error)
    throw error
  }
}

/**
 * Get analytics for a salon's promotions (UC 1.18)
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>}
 */
export async function getPromotionAnalytics(salonId) {
  try {
    const response = await get(`/salons/${salonId}/promotions/analytics`)
    return response
  } catch (error) {
    console.error('Error fetching promotion analytics:', error)
    throw error
  }
}
