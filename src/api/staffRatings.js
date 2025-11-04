import { apiBaseURL } from './http';

/**
 * Rate a staff member
 * @param {number} staffId - The ID of the staff member
 * @param {number} clientId - The ID of the client
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>}
 */
export async function rateStaff(staffId, clientId, rating, comment = '') {
  const response = await fetch(`${apiBaseURL}/staff/${staffId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ client_id: clientId, rating, comment }),
  });
  if (!response.ok) throw new Error('Failed to rate staff');
  return response.json();
}

/**
 * Get reviews for a staff member
 * @param {number} staffId - The ID of the staff member
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Results per page (default 20)
 * @returns {Promise<Object>}
 */
export async function getStaffReviews(staffId, page = 1, limit = 20) {
  const response = await fetch(
    `${apiBaseURL}/staff/${staffId}/reviews?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch staff reviews');
  return response.json();
}

/**
 * Get average rating for a staff member
 * @param {number} staffId - The ID of the staff member
 * @returns {Promise<Object>}
 */
export async function getStaffRating(staffId) {
  const response = await fetch(`${apiBaseURL}/staff/${staffId}/rating`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch staff rating');
  return response.json();
}
