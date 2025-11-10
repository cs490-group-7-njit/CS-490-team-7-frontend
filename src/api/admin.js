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
export const getSalonSummary = async () => {
  const response = await fetch('/admin/salons/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch salon summary')
  }
  return response.json()
}

// Verify salon (approve or reject)
export async function verifySalon(salonId, action, adminNotes = null) {
  const payload = {
    action: action, // 'approve' or 'reject'
    admin_notes: adminNotes
  }

  const response = await fetch(`/admin/salons/${salonId}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Failed to verify salon')
  }
  return response.json()
}

/**
 * UC 3.3: Admin Data Analytics API functions
 */

// Get comprehensive analytics data for visualizations
export async function getAnalyticsData() {
  const response = await fetch('/admin/analytics')
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  return response.json()
}

// Get real-time analytics data for dashboard widgets
export async function getRealtimeAnalytics() {
  const response = await fetch('/admin/analytics/realtime')
  if (!response.ok) {
    throw new Error('Failed to fetch realtime analytics')
  }
  return response.json()
}
