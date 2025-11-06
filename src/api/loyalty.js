import { get, post } from './http'

export function getUserLoyalty(userId) {
  return get(`/users/${userId}/loyalty`)
}

export function getLoyaltyRedemptions(userId, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  return get(`/users/${userId}/loyalty/redemptions?${params.toString()}`)
}

export function redeemLoyaltyPoints(userId, points) {
  return post(`/users/${userId}/loyalty/redeem`, {
    points,
  })
}
