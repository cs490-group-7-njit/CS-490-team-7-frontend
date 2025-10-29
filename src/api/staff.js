import { del, get, post, put } from './http'

/**
 * UC 1.6: Staff Management API functions
 */

// Get all staff members for a salon
export async function getStaffBySalon(salonId) {
  try {
    const response = await get(`/salons/${salonId}/staff`)
    return response.staff || []
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

// Schedule management API functions (UC 1.6)
export async function updateStaffSchedule(salonId, staffId, scheduleData) {
  try {
    const payload = {
      schedule: scheduleData
    }
    const response = await put(`/salons/${salonId}/staff/${staffId}/schedule`, payload)
    return response
  } catch (error) {
    console.error('Error updating staff schedule:', error)
    throw error
  }
}

export async function blockTime(staffId, blockData) {
  return post(`/staff/${staffId}/time-blocks`, blockData)
}