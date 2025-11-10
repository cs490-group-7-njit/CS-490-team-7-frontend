/**
 * UC 3.1: Admin User Analytics API functions
 */

// Get all users with activity metrics
export async function getAllUsers(options = {}) {
  const {
    role = '',
    status = '',
    sortBy = 'created_at',
    order = 'desc',
    limit = 50,
    offset = 0
  } = options

  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (status) params.append('status', status)
  params.append('sort_by', sortBy)
  params.append('order', order)
  params.append('limit', limit)
  params.append('offset', offset)

  const response = await fetch(`/admin/users?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return response.json()
}

// Get user summary statistics
export async function getUserSummary() {
  const response = await fetch('/admin/users/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch user summary')
  }
  return response.json()
}

/**
 * UC 3.2: Admin Salon Analytics API functions
 */

// Get all salons with activity metrics
export async function getAllSalons(options = {}) {
  const {
    status = '',
    businessType = '',
    sortBy = 'created_at',
    order = 'desc',
    limit = 50,
    offset = 0
  } = options

  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (businessType) params.append('business_type', businessType)
  params.append('sort_by', sortBy)
  params.append('order', order)
  params.append('limit', limit)
  params.append('offset', offset)

  const response = await fetch(`/admin/salons?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch salons')
  }
  return response.json()
}

// Get salon summary statistics
export async function getSalonSummary() {
  const response = await fetch('/admin/salons/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch salon summary')
  }
  return response.json()
}
