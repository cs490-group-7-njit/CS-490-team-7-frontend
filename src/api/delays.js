import { get, post, put } from './http';

/**
 * Notify clients that appointment is delayed
 * @param {number} salonId - Salon ID
 * @param {object} delayData - Delay notification data
 * @returns {Promise<object>} Delay notification response
 */
export async function notifyAppointmentDelay(salonId, delayData) {
  try {
    const response = await post(`/salons/${salonId}/delays/notify`, delayData);
    return response;
  } catch (error) {
    console.error('Error notifying appointment delay:', error);
    throw error;
  }
}

/**
 * Get all delay notifications for a salon
 * @param {number} salonId - Salon ID
 * @param {string} filter - Filter type (all, pending, resolved)
 * @returns {Promise<object>} Delays list
 */
export async function getSalonDelays(salonId, filter = 'all') {
  try {
    const response = await get(`/salons/${salonId}/delays?filter=${filter}`);
    return response;
  } catch (error) {
    console.error('Error fetching salon delays:', error);
    throw error;
  }
}

/**
 * Mark a delay notification as resolved
 * @param {number} salonId - Salon ID
 * @param {string} delayId - Delay ID
 * @returns {Promise<object>} Resolution response
 */
export async function resolveDelay(salonId, delayId) {
  try {
    const response = await put(`/salons/${salonId}/delays/${delayId}/resolve`, {});
    return response;
  } catch (error) {
    console.error('Error resolving delay:', error);
    throw error;
  }
}

/**
 * Get delay history for an appointment
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<object>} Appointment delay history
 */
export async function getAppointmentDelayHistory(appointmentId) {
  try {
    const response = await get(`/appointments/${appointmentId}/delays`);
    return response;
  } catch (error) {
    console.error('Error fetching appointment delay history:', error);
    throw error;
  }
}

/**
 * Get delay analytics for a salon
 * @param {number} salonId - Salon ID
 * @returns {Promise<object>} Delay analytics
 */
export async function getDelayAnalytics(salonId) {
  try {
    const response = await get(`/salons/${salonId}/delays/analytics`);
    return response;
  } catch (error) {
    console.error('Error fetching delay analytics:', error);
    throw error;
  }
}
