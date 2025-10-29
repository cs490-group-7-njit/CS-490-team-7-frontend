import { get, put } from './http'

/**
 * UC 2.5: Vendor Appointment Management API functions
 */

/**
 * Get appointments for a salon
 * @param {number} salonId - The salon ID
 * @param {string} status - Filter by status (optional: 'booked', 'completed', 'cancelled', 'no-show')
 * @param {string} date - Filter by date in YYYY-MM-DD format (optional)
 * @returns {Promise<Array>} Array of appointments
 */
export const getSalonAppointments = async (salonId, status = null, date = null) => {
  let url = `/salons/${salonId}/appointments`
  const params = new URLSearchParams()

  if (status) {
    params.append('status', status)
  }
  if (date) {
    params.append('date', date)
  }

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await get(url)
  return response.appointments || []
}

/**
 * Update appointment status
 * @param {number} appointmentId - The appointment ID
 * @param {string} newStatus - New status ('booked', 'completed', 'cancelled', 'no-show')
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointmentStatus = async (appointmentId, newStatus) => {
  const response = await put(`/appointments/${appointmentId}/status`, {
    status: newStatus
  })
  return response.appointment
}
