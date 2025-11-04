/**
 * UC 2.15: Salon Performance Analytics API functions
 */

// Get analytics data for a specific salon
export async function getSalonAnalytics(salonId) {
  const response = await fetch(`/salons/${salonId}/analytics`)
  if (!response.ok) {
    throw new Error('Failed to fetch salon analytics')
  }
  return response.json()
}
