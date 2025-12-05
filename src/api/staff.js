import { del, get, post, put } from './http'
import { getMyShops } from './shops'

/**
 * UC 1.6: Staff Management API functions
 */

// Get all salons owned by the current vendor
export async function getSalons(vendorId) {
  try {
    if (vendorId) {
      const { salons } = await getMyShops(vendorId)
      return { salons: salons || [] }
    }

    const response = await get('/salons')
    return { salons: response.salons || [] }
  } catch (error) {
    console.error('Error fetching vendor salons:', error)
    throw error
  }
}

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

const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

export async function getStaffSchedules(staffId) {
  try {
    const response = await get(`/staff/${staffId}/schedules`)
    return response.schedules || []
  } catch (error) {
    console.error('Error fetching staff schedules:', error)
    throw error
  }
}

export async function replaceStaffSchedules(staffId, schedule) {
  try {
    const existing = await getStaffSchedules(staffId)

    for (const entry of existing) {
      if (entry?.id == null) continue
      await del(`/staff/${staffId}/schedules/${entry.id}`)
    }

    const requests = []

    Object.entries(schedule || {}).forEach(([dayName, config]) => {
      if (!config || !config.enabled || !Array.isArray(config.shifts)) {
        return
      }

      const dayIndex = DAY_NAME_TO_INDEX[dayName]
      if (dayIndex == null) return

      config.shifts.forEach((shift) => {
        const start = (shift?.start || '').trim()
        const end = (shift?.end || '').trim()
        if (!start || !end) return

        requests.push(
          post(`/staff/${staffId}/schedules`, {
            day_of_week: dayIndex,
            start_time: start,
            end_time: end,
          })
        )
      })
    })

    await Promise.all(requests)
  } catch (error) {
    console.error('Error replacing staff schedules:', error)
    throw error
  }
}

export async function getStaffTimeBlocks(staffId) {
  const response = await get(`/staff/${staffId}/time-blocks`)
  return response.time_blocks || response.timeBlocks || []
}

export async function getStaffTimeBlocksForDate(staffId, date) {
  const response = await get(`/staff/${staffId}/time-blocks/${date}`)
  return response.time_blocks || response.timeBlocks || []
}

export async function createTimeBlock(staffId, blockData) {
  return post(`/staff/${staffId}/time-blocks`, blockData)
}

export async function deleteTimeBlock(blockId) {
  return del(`/time-blocks/${blockId}`)
}