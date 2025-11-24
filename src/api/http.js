const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://3.129.138.4'

function getAuthToken() {
  try {
    const stored = localStorage.getItem('salonhub.auth')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed.token || null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : null

  if (!response.ok) {
    const message = body?.message || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

export function post(path, payload) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function get(path) {
  return request(path, {
    method: 'GET',
  })
}

export function put(path, payload) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function del(path) {
  return request(path, {
    method: 'DELETE',
  })
}

export { API_BASE_URL as apiBaseURL }
