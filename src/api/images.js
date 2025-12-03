import { del, get, post, put } from './http'

/**
 * Upload an image for an appointment (before/after service)
 * @param {number} appointmentId - The appointment ID
 * @param {File} file - The image file
 * @param {string} type - Image type ('before', 'after', 'other')
 * @param {string} description - Optional image description
 * @returns {Promise<Object>}
 */
export async function uploadAppointmentImage(appointmentId, file, type = 'other', description = '') {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    formData.append('description', description)

    return post(
      `/appointments/${appointmentId}/images`,
      formData,
      { credentials: 'include' }
    )
  } catch (error) {
    console.error('Error uploading appointment image:', error)
    throw error
  }
}

/**
 * Get all images for an appointment
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>}
 */
export async function getAppointmentImages(appointmentId) {
  try {
    return get(
      `/appointments/${appointmentId}/images`,
      { credentials: 'include' }
    )
  } catch (error) {
    console.error('Error fetching appointment images:', error)
    throw error
  }
}

/**
 * Delete an image from an appointment
 * @param {number} appointmentId - The appointment ID
 * @param {string} imageId - The image ID
 * @returns {Promise<Object>}
 */
export async function deleteAppointmentImage(appointmentId, imageId) {
  try {
    return del(
      `/appointments/${appointmentId}/images/${imageId}`,
      { credentials: 'include' }
    )
  } catch (error) {
    console.error('Error deleting appointment image:', error)
    throw error
  }
}

/**
 * Update image metadata (description, type)
 * @param {number} appointmentId - The appointment ID
 * @param {string} imageId - The image ID
 * @param {Object} metadata - Updated metadata
 * @returns {Promise<Object>}
 */
export async function updateAppointmentImageMetadata(appointmentId, imageId, metadata) {
  try {
    return put(
      `/appointments/${appointmentId}/images/${imageId}`,
      metadata,
      { credentials: 'include' }
    )
  } catch (error) {
    console.error('Error updating image metadata:', error)
    throw error
  }
}

/**
 * Get all before/after images for a service
 * @param {number} serviceId - The service ID
 * @returns {Promise<Object>}
 */
export async function getServiceImages(serviceId) {
  try {
    return get(
      `/services/${serviceId}/images`,
      { credentials: 'include' }
    )
  } catch (error) {
    console.error('Error fetching service images:', error)
    throw error
  }
}
