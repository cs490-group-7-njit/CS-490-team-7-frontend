import { get } from './http'

/**
 * Get vendor info by vendor user ID
 * @param {number|string} vendorUserId - The user ID of the vendor
 * @returns {Promise<{user_id: number, name: string, email: string}>} Vendor info
 */
export const getVendorInfo = async (vendorUserId) => {
  if (!vendorUserId) throw new Error('Vendor ID is required')
  const response = await get(`/users/vendor/${vendorUserId}`)
  return response
}

export default {
  getVendorInfo,
}
