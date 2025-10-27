import { del, get, post, put } from './http'

/**
 * UC 1.6: Staff Management API functions
 */

// Get all staff members for a salon
export async function getStaffBySalon(salonId) {
  try {
    const response = await get(`/salons/${salonId}/staff`)
    return response
  } catch (error) {
    console.error('Error fetching staff:', error)
    throw error
  }
}

// Create a new staff member
export async function createStaff(salonId, staffData) {
  try {
    const payload = {
      title: staffData.title,
      user_id: staffData.user_id || null
    }
    const response = await post(`/salons/${salonId}/staff`, payload)
    return response
  } catch (error) {
    console.error('Error creating staff:', error)
    throw error
  }
}

// Update a staff member
export async function updateStaff(salonId, staffId, staffData) {
  try {
    const payload = {
      title: staffData.title,
      user_id: staffData.user_id || null
    }
    const response = await put(`/salons/${salonId}/staff/${staffId}`, payload)
    return response
  } catch (error) {
    console.error('Error updating staff:', error)
    throw error
  }
}

// Delete a staff member
export async function deleteStaff(salonId, staffId) {
  try {
    const response = await del(`/salons/${salonId}/staff/${staffId}`)
    return response
  } catch (error) {
    console.error('Error deleting staff:', error)
    throw error
  }
}

// Schedule management API functions (placeholder for UC 1.7)
export async function getStaffSchedule(staffId) {
  return get(`/staff/${staffId}/schedule`)
}

export async function updateStaffSchedule(staffId, scheduleData) {
  return put(`/staff/${staffId}/schedule`, scheduleData)
}

export async function blockTime(staffId, blockData) {
  return post(`/staff/${staffId}/time-blocks`, blockData)
}