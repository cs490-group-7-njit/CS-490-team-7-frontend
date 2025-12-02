import { get } from './http'

/**
 * Get vendor info by vendor user id
 * @param {number|string} vendorId
 */
export const getVendorInfo = async (vendorId) => {
  if (!vendorId) throw new Error('vendorId is required')
  const response = await get(`/users/vendor/${vendorId}`)
  return response
}

export default {
  getVendorInfo,
}
