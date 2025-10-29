import { del, get, put } from './http'

/**
 * UC 2.4: Appointment Details API functions
 */

/**
 * Get appointment details
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Appointment details with related objects
 */
export const getAppointment = async (appointmentId) => {
  const response = await get(`/appointments/${appointmentId}`)
  return response.appointment
}

/**
 * Cancel an appointment
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Updated appointment with cancelled status
 */
export const cancelAppointment = async (appointmentId) => {
  const response = await del(`/appointments/${appointmentId}`)
  return response.appointment
}

/**
 * Reschedule an appointment to a new date/time
 * @param {number} appointmentId - The appointment ID
 * @param {string} newStartsAt - ISO datetime string for new appointment start
 * @returns {Promise<Object>} Updated appointment with new datetime
 */
export const rescheduleAppointment = async (appointmentId, newStartsAt) => {
  const response = await put(`/appointments/${appointmentId}/reschedule`, {
    starts_at: newStartsAt
  })
  return response.appointment
}

/**
 * Get available slots for rescheduling (same staff, same service)
 * @param {number} staffId - The staff ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} durationMinutes - Service duration in minutes
 * @returns {Promise<Array>} Available time slots
 */
export const getAvailableSlotsForReschedule = async (staffId, date, durationMinutes) => {
  const response = await get(
    `/staff/${staffId}/availability?date=${date}&duration_minutes=${durationMinutes}`
  )
  return response.available_slots || []
}
