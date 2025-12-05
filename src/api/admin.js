import { get, put } from './http'

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

  return get(`/admin/users?${params}`)
}

// Get user summary statistics
export async function getUserSummary() {
  return get('/admin/users/summary')
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

  return get(`/admin/salons?${params}`)
}

// Get salon summary statistics
export const getSalonSummary = async () => {
  return get('/admin/salons/summary')
}

// Verify salon (approve or reject)
export async function verifySalon(salonId, action, adminNotes = null) {
  const payload = {
    action: action, // 'approve' or 'reject'
    admin_notes: adminNotes
  }

  return put(`/admin/salons/${salonId}/verify`, payload)
}

/**
 * UC 3.3: Admin Data Analytics API functions
 */

// Get comprehensive analytics data for visualizations
export async function getAnalyticsData() {
  return get('/admin/analytics')
}

// Get real-time analytics data for dashboard widgets
export async function getRealtimeAnalytics() {
  return get('/admin/analytics/realtime')
}

/**
 * UC 3.10: Admin Reports API functions
 */

// Generate reports with various formats and types
export async function generateReport(options = {}) {
  const {
    reportType = 'summary',
    format = 'json',
    period = '30d',
    dateFrom = '',
    dateTo = ''
  } = options

  const params = new URLSearchParams()
  params.append('report_type', reportType)
  params.append('format', format)
  params.append('period', period)
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)

  return get(`/admin/reports?${params}`)
}

// Get real platform statistics (actual data from database)
export async function getPlatformStats() {
  return get('/admin/platform-stats')
}

export async function getRevenueMetrics() {
  return get('/admin/revenue-metrics')
}

export async function getAppointmentTrends() {
  return get('/admin/appointment-trends')
}

export async function getLoyaltyProgram() {
  return get('/admin/loyalty-program')
}

export async function getPendingActions() {
  return get('/admin/pending-actions')
}

