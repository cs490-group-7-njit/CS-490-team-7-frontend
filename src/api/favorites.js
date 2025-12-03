/**
 * UC 2.20: Save Favorite Salons API functions
 */

import { del, get, post } from './http'

// Check if a salon is favorited by the user
export async function checkIfFavorite(salonId, userId) {
  return get(`/salons/${salonId}/is-favorite?user_id=${userId}`)
}

// Add a salon to favorites
export async function addToFavorites(userId, salonId) {
  // No body required; auth header handled by http helper
  return post(`/users/${userId}/favorites/${salonId}`)
}

// Remove a salon from favorites
export async function removeFromFavorites(userId, salonId) {
  return del(`/users/${userId}/favorites/${salonId}`)
}

// Get all favorite salons for a user
export async function getFavoriteSalons(userId, page = 1, limit = 20) {
  return get(`/users/${userId}/favorites?page=${page}&limit=${limit}`)
}
