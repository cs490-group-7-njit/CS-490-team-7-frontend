import { get, post, put, del } from './http';

/**
 * Add a social media link to salon
 * @param {number} salonId - Salon ID
 * @param {object} linkData - Social media link data
 * @returns {Promise<object>} New link response
 */
export async function addSocialMediaLink(salonId, linkData) {
  try {
    const response = await post(`/salons/${salonId}/social-media`, linkData);
    return response;
  } catch (error) {
    console.error('Error adding social media link:', error);
    throw error;
  }
}

/**
 * Get all visible social media links for a salon
 * @param {number} salonId - Salon ID
 * @returns {Promise<object>} Social media links
 */
export async function getSalonSocialMedia(salonId) {
  try {
    const response = await get(`/salons/${salonId}/social-media`);
    return response;
  } catch (error) {
    console.error('Error fetching social media links:', error);
    throw error;
  }
}

/**
 * Get all social media links for a salon (vendor only, includes hidden)
 * @param {number} salonId - Salon ID
 * @returns {Promise<object>} All social media links
 */
export async function getAllSalonSocialMedia(salonId) {
  try {
    const response = await get(`/salons/${salonId}/social-media/all`);
    return response;
  } catch (error) {
    console.error('Error fetching all social media links:', error);
    throw error;
  }
}

/**
 * Update a social media link
 * @param {number} salonId - Salon ID
 * @param {string} linkId - Link ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Update response
 */
export async function updateSocialMediaLink(salonId, linkId, updateData) {
  try {
    const response = await put(`/salons/${salonId}/social-media/${linkId}`, updateData);
    return response;
  } catch (error) {
    console.error('Error updating social media link:', error);
    throw error;
  }
}

/**
 * Delete a social media link
 * @param {number} salonId - Salon ID
 * @param {string} linkId - Link ID
 * @returns {Promise<object>} Delete response
 */
export async function deleteSocialMediaLink(salonId, linkId) {
  try {
    const response = await del(`/salons/${salonId}/social-media/${linkId}`);
    return response;
  } catch (error) {
    console.error('Error deleting social media link:', error);
    throw error;
  }
}
