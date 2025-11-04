import { apiRequest } from './http'

export const getMessages = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  return apiRequest(`/users/${userId}/messages?${params}`)
}

export const sendMessage = async (messageData) => {
  return apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  })
}

export const markMessageAsRead = async (messageId) => {
  return apiRequest(`/messages/${messageId}/read`, {
    method: 'PUT',
  })
}