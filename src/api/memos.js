import { del, get, post, put } from './http'

/**
 * UC 1.12: Appointment Memos API functions
 */

/**
 * Create a new appointment memo
 * @param {number} appointmentId - The appointment ID
 * @param {Object} memoData - Memo data containing content
 * @returns {Promise<Object>} Created memo object
 */
export async function createAppointmentMemo(appointmentId, memoData) {
  try {
    const payload = {
      content: memoData.content
    }
    const response = await post(`/appointments/${appointmentId}/memos`, payload)
    return response
  } catch (error) {
    console.error('Error creating appointment memo:', error)
    throw error
  }
}

/**
 * Get all memos for an appointment
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Object containing list of memos
 */
export async function getAppointmentMemos(appointmentId) {
  try {
    const response = await get(`/appointments/${appointmentId}/memos`)
    return response.memos || []
  } catch (error) {
    console.error('Error fetching appointment memos:', error)
    throw error
  }
}

/**
 * Update an appointment memo
 * @param {number} memoId - The memo ID
 * @param {Object} memoData - Updated memo data containing content
 * @returns {Promise<Object>} Updated memo object
 */
export async function updateAppointmentMemo(memoId, memoData) {
  try {
    const payload = {
      content: memoData.content
    }
    const response = await put(`/memos/${memoId}`, payload)
    return response
  } catch (error) {
    console.error('Error updating appointment memo:', error)
    throw error
  }
}

/**
 * Delete an appointment memo
 * @param {number} memoId - The memo ID
 * @returns {Promise<Object>} Response object
 */
export async function deleteAppointmentMemo(memoId) {
  try {
    const response = await del(`/memos/${memoId}`)
    return response
  } catch (error) {
    console.error('Error deleting appointment memo:', error)
    throw error
  }
}
