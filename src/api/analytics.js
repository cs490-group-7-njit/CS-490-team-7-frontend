import { get } from './http'

/**
 * UC 2.15: Salon Performance Analytics API functions
 */

// Get analytics data for a specific salon
export async function getSalonAnalytics(salonId) {
  return get(`/salons/${salonId}/analytics`)
}
