import { del, get, post, put } from "./http";

/**
 * Get all appointments for the user.
 * @returns {Promise<Array>} Array of appointments
 */
export const listAppointments = async () => {
  const response = await get("/appointments");
  return response.appointments || [];
};

/**
 * Check available time slots for a staff member on a given date.
 * @param {number} staffId - The staff ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} durationMinutes - Service duration in minutes
 * @returns {Promise<Array>} Array of available slot timestamps
 */
export const getAvailableSlots = async (staffId, date, durationMinutes) => {
  const response = await get(
    `/staff/${staffId}/availability?date=${date}&duration_minutes=${durationMinutes}`
  );
  return response.available_slots || [];
};

/**
 * Create a new appointment.
 * @param {Object} appointmentData - Appointment details {salon_id, staff_id, service_id, client_id, starts_at, notes}
 * @returns {Promise<Object>} Created appointment
 */
export const createAppointment = async (appointmentData) => {
  const response = await post("/appointments", appointmentData);
  return response.appointment;
};

/**
 * Update an appointment.
 * @param {number} appointmentId - The appointment ID
 * @param {Object} appointmentData - Fields to update {starts_at, notes, status}
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  const response = await put(`/appointments/${appointmentId}`, appointmentData);
  return response.appointment;
};

/**
 * Cancel/delete an appointment.
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Success message
 */
export const deleteAppointment = async (appointmentId) => {
  const response = await del(`/appointments/${appointmentId}`);
  return response;
};
