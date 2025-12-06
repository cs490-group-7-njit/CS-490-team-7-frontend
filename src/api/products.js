import { del, get, post, put } from './http'

export function getSalonProducts(salonId, { page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  return get(`/salons/${salonId}/products?${params.toString()}`)
}

export function purchaseProduct(userId, productId, quantity) {
  return post(`/users/${userId}/products/purchase`, {
    product_id: productId,
    quantity,
  })
}

/**
 * Create a new product for a salon (vendor only)
 * @param {number} salonId - The salon ID
 * @param {Object} productData - Product details
 * @param {number} vendorId - The vendor ID for authorization
 * @returns {Promise<Object>} Created product
 */
export function createSalonProduct(salonId, productData, vendorId) {
  return post(`/salons/${salonId}/products`, productData, {
    headers: {
      'X-Vendor-ID': String(vendorId)
    }
  })
}

/**
 * Update a product in a salon (vendor only)
 * @param {number} salonId - The salon ID
 * @param {number} productId - The product ID
 * @param {Object} productData - Fields to update
 * @param {number} vendorId - The vendor ID for authorization
 * @returns {Promise<Object>} Updated product
 */
export function updateSalonProduct(salonId, productId, productData, vendorId) {
  return put(`/salons/${salonId}/products/${productId}`, productData, {
    headers: {
      'X-Vendor-ID': String(vendorId)
    }
  })
}

/**
 * Delete a product from a salon (vendor only)
 * @param {number} salonId - The salon ID
 * @param {number} productId - The product ID
 * @param {number} vendorId - The vendor ID for authorization
 * @returns {Promise<Object>} Result
 */
export function deleteSalonProduct(salonId, productId, vendorId) {
  return del(`/salons/${salonId}/products/${productId}`, {
    headers: {
      'X-Vendor-ID': String(vendorId)
    }
  })
}
