import { get, post } from './http'

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
