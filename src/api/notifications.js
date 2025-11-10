import { apiRequest } from './http'

export const getNotifications = async (userId, options = {}) => {
  const { unreadOnly = false, page = 1, limit = 20 } = options
  const params = new URLSearchParams({
    unread_only: unreadOnly.toString(),
    page: page.toString(),
    limit: limit.toString(),
  })

  return apiRequest(`/users/${userId}/notifications?${params}`)
}

export const markNotificationAsRead = async (notificationId) => {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

export const markAllNotificationsAsRead = async (userId) => {
  return apiRequest(`/users/${userId}/notifications/read-all`, {
    method: 'PUT',
  })
}