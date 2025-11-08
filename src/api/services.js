import { get, post, put, del } from "./http";

/**
 * Get all services for a salon.
 * @param {number} salonId - The salon ID
 * @returns {Promise<Array>} Array of services
 */
export const getServicesBySalon = async (salonId) => {
  const response = await get(`/salons/${salonId}/services`);
  return response.services || [];
};

/**
 * Create a new service for a salon.
 * @param {number} salonId - The salon ID
 * @param {Object} serviceData - Service details {name, description, price_cents, duration_minutes}
 * @returns {Promise<Object>} Created service
 */
export const createService = async (salonId, serviceData) => {
  const response = await post(`/salons/${salonId}/services`, serviceData);
  return response.service;
};

/**
 * Update a service.
 * @param {number} salonId - The salon ID
 * @param {number} serviceId - The service ID
 * @param {Object} serviceData - Service details to update
 * @returns {Promise<Object>} Updated service
 */
export const updateService = async (salonId, serviceId, serviceData) => {
  const response = await put(
    `/salons/${salonId}/services/${serviceId}`,
    serviceData
  );
  return response.service;
};

/**
 * Delete a service.
 * @param {number} salonId - The salon ID
 * @param {number} serviceId - The service ID
 * @returns {Promise<Object>} Success message
 */
export const deleteService = async (salonId, serviceId) => {
  const response = await del(`/salons/${salonId}/services/${serviceId}`);
  return response;
};
