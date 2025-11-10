import { get, put } from './http'

export const getNotifications = async (userId, options = {}) => {
  const { unreadOnly = false, page = 1, limit = 20 } = options
  const params = new URLSearchParams({
    unread_only: unreadOnly.toString(),
    page: page.toString(),
    limit: limit.toString(),
  })

  return get(`/users/${userId}/notifications?${params}`)
}

export const markNotificationAsRead = async (notificationId) => {
  return put(`/notifications/${notificationId}/read`)
}

export const markAllNotificationsAsRead = async (userId) => {
  return put(`/users/${userId}/notifications/read-all`)
}