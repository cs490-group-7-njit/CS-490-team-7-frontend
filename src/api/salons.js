import { get } from './http'

/**
 * Search and filter salons with pagination support (UC 2.7)
 * @param {Object} filters - Filter parameters
 * @param {string} filters.query - Search query for salon name
 * @param {string} filters.city - Filter by city
 * @param {string} filters.business_type - Filter by business type
 * @param {string} filters.sort - Sort field (name, created_at)
 * @param {string} filters.order - Sort order (asc, desc)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Results per page (default: 12)
 * @returns {Promise<Object>} Response with salons and pagination data
 */
export const searchSalons = async (filters = {}) => {
  try {
    const params = new URLSearchParams()

    if (filters.query) params.append('query', filters.query)
    if (filters.city) params.append('city', filters.city)
    if (filters.business_type) params.append('business_type', filters.business_type)
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)

    const queryString = params.toString()
    const url = queryString ? `/salons?${queryString}` : '/salons'

    const response = await get(url)
    return response
  } catch (error) {
    console.error('Error searching salons:', error)
    throw error
  }
}

/**
 * Get salon details including services and staff (UC 2.6)
 * @param {number} salonId - The salon ID
 * @returns {Promise<Object>} Salon details with services and staff
 */
export const getSalonDetails = async (salonId) => {
  try {
    const response = await get(`/salons/${salonId}`)
    return response
  } catch (error) {
    console.error(`Error fetching salon ${salonId}:`, error)
    throw error
  }
}
