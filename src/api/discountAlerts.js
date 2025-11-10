import { get, put } from './http'

export function getDiscountAlerts(userId, { activeOnly = false } = {}) {
  const params = new URLSearchParams()

  if (activeOnly) {
    params.set('active_only', 'true')
  }

  const queryString = params.toString()
  const path = queryString
    ? `/users/${userId}/discount-alerts?${queryString}`
    : `/users/${userId}/discount-alerts`

  return get(path)
}

export function dismissDiscountAlert(alertId) {
  return put(`/discount-alerts/${alertId}/dismiss`, {})
}
