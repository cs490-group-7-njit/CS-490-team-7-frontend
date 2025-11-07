import { get } from './http'

/**
 * UC 1.13: Daily Schedule API functions
 */

/**
 * Get daily schedule for a staff member
 * @param {number} staffId - The staff ID
 * @param {string} date - Date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Object>} Daily schedule object with appointments and unavailable times
 */
export async function getStaffDailySchedule(staffId, date) {
  try {
    const response = await get(`/staff/${staffId}/schedule/${date}`)
    return response
  } catch (error) {
    console.error('Error fetching daily schedule:', error)
    throw error
  }
}

/**
 * Get weekly schedule for a staff member
 * @param {number} staffId - The staff ID
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Object>} Weekly schedule object with appointments grouped by day
 */
export async function getStaffWeeklySchedule(staffId, startDate) {
  try {
    const response = await get(`/staff/${staffId}/schedule/week/${startDate}`)
    return response
  } catch (error) {
    console.error('Error fetching weekly schedule:', error)
    throw error
  }
}
