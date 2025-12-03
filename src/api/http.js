const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
  const headers = { ...(options.headers || {}) }
  const isFormData = options.body instanceof FormData
  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === 'content-type'
  )

  if (!isFormData && !hasContentType && options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token && !headers.Authorization) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : null

  if (!response.ok) {
    const message = body?.message || response.statusText || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

export function post(path, payload, options = {}) {
  const isFormData = payload instanceof FormData
  const body = payload === undefined ? undefined : (isFormData ? payload : JSON.stringify(payload))

  return request(path, {
    method: 'POST',
    body,
    ...options,
  })
}

export function get(path, options = {}) {
  return request(path, {
    method: 'GET',
    ...options,
  })
}

export function put(path, payload, options = {}) {
  const isFormData = payload instanceof FormData
  const body = payload === undefined ? undefined : (isFormData ? payload : JSON.stringify(payload))

  return request(path, {
    method: 'PUT',
    body,
    ...options,
  })
}

export function del(path, options = {}) {
  return request(path, {
    method: 'DELETE',
    ...options,
  })
}

export { API_BASE_URL as apiBaseURL, request }
