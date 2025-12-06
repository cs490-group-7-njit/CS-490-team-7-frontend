import { get, post, put, del } from './http'

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
 * @returns {Promise<Object>} Created product
 */
export function createSalonProduct(salonId, productData) {
  return post(`/salons/${salonId}/products`, productData)
}

/**
 * Update a product in a salon (vendor only)
 * @param {number} salonId - The salon ID
 * @param {number} productId - The product ID
 * @param {Object} productData - Fields to update
 * @returns {Promise<Object>} Updated product
 */
export function updateSalonProduct(salonId, productId, productData) {
  return put(`/salons/${salonId}/products/${productId}`, productData)
}

/**
 * Delete a product from a salon (vendor only)
 * @param {number} salonId - The salon ID
 * @param {number} productId - The product ID
 * @returns {Promise<Object>} Result
 */
export function deleteSalonProduct(salonId, productId) {
  return del(`/salons/${salonId}/products/${productId}`)
}
