/**
 * UC 2.20: Save Favorite Salons API functions
 */

// Check if a salon is favorited by the user
export async function checkIfFavorite(salonId, userId) {
  const response = await fetch(`/salons/${salonId}/is-favorite?user_id=${userId}`)
  if (!response.ok) {
    throw new Error('Failed to check favorite status')
  }
  return response.json()
}

// Add a salon to favorites
export async function addToFavorites(userId, salonId) {
  const response = await fetch(`/users/${userId}/favorites/${salonId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('Failed to add to favorites')
  }
  return response.json()
}

// Remove a salon from favorites
export async function removeFromFavorites(userId, salonId) {
  const response = await fetch(`/users/${userId}/favorites/${salonId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to remove from favorites')
  }
  return response.json()
}

// Get all favorite salons for a user
export async function getFavoriteSalons(userId, page = 1, limit = 20) {
  const response = await fetch(`/users/${userId}/favorites?page=${page}&limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch favorite salons')
  }
  return response.json()
}
