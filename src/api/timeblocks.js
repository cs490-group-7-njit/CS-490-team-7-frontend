import { del, get, post, put } from './http'

/**
 * UC 1.14: Time Block Management API functions
 */

/**
 * Create a time block for a staff member
 * @param {number} staffId - The staff ID
 * @param {Object} blockData - Block data containing block_start, block_end, and reason
 * @returns {Promise<Object>} Created time block object
 */
export async function createTimeBlock(staffId, blockData) {
  try {
    const payload = {
      block_start: blockData.block_start,
      block_end: blockData.block_end,
      reason: blockData.reason,
    }
    const response = await post(`/staff/${staffId}/time-blocks`, payload)
    return response
  } catch (error) {
    console.error('Error creating time block:', error)
    throw error
  }
}

/**
 * Get all time blocks for a staff member
 * @param {number} staffId - The staff ID
 * @returns {Promise<Object>} Object containing list of time blocks
 */
export async function getStaffTimeBlocks(staffId) {
  try {
    const response = await get(`/staff/${staffId}/time-blocks`)
    return response.time_blocks || []
  } catch (error) {
    console.error('Error fetching time blocks:', error)
    throw error
  }
}

/**
 * Get time blocks for a specific date
 * @param {number} staffId - The staff ID
 * @param {string} date - Date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of time blocks for the specified date
 */
export async function getTimeBlocksForDate(staffId, date) {
  try {
    const response = await get(`/staff/${staffId}/time-blocks/${date}`)
    return response.time_blocks || []
  } catch (error) {
    console.error('Error fetching time blocks for date:', error)
    throw error
  }
}

/**
 * Update a time block
 * @param {number} blockId - The time block ID
 * @param {Object} blockData - Updated block data
 * @returns {Promise<Object>} Updated time block object
 */
export async function updateTimeBlock(blockId, blockData) {
  try {
    const payload = {
      block_start: blockData.block_start,
      block_end: blockData.block_end,
      reason: blockData.reason,
    }
    const response = await put(`/time-blocks/${blockId}`, payload)
    return response
  } catch (error) {
    console.error('Error updating time block:', error)
    throw error
  }
}

/**
 * Delete a time block
 * @param {number} blockId - The time block ID
 * @returns {Promise<Object>} Response object
 */
export async function deleteTimeBlock(blockId) {
  try {
    const response = await del(`/time-blocks/${blockId}`)
    return response
  } catch (error) {
    console.error('Error deleting time block:', error)
    throw error
  }
}
