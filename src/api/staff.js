import { get, post, put } from './http'

// Staff management API functions
export async function getStaff() {
  return get('/staff')
}

export async function addStaff(staffData) {
  return post('/staff', staffData)
}

export async function updateStaff(staffId, staffData) {
  return put(`/staff/${staffId}`, staffData)
}

// Schedule management API functions
export async function getStaffSchedule(staffId) {
  return get(`/staff/${staffId}/schedule`)
}

export async function updateStaffSchedule(staffId, scheduleData) {
  return put(`/staff/${staffId}/schedule`, scheduleData)
}

export async function blockTime(staffId, blockData) {
  return post(`/staff/${staffId}/time-blocks`, blockData)
}