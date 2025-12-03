import { apiBaseURL } from '../api/http'

function isAbsoluteUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function resolveAppointmentImageUrl(image) {
  if (!image) {
    return ''
  }

  if (typeof image === 'string') {
    if (image.startsWith('data:') || isAbsoluteUrl(image)) {
      return image
    }
    return `${apiBaseURL}/uploads/appointment_images/${image}`
  }

  const directUrl = image.url || image.secure_url || image.path
  if (directUrl) {
    if (directUrl.startsWith('data:') || isAbsoluteUrl(directUrl)) {
      return directUrl
    }
    return `${apiBaseURL}/uploads/appointment_images/${directUrl}`
  }

  const filename = image.filename || image.name
  if (!filename) {
    return ''
  }

  if (filename.startsWith('data:') || isAbsoluteUrl(filename)) {
    return filename
  }

  return `${apiBaseURL}/uploads/appointment_images/${filename}`
}

export function formatImageTypeLabel(type) {
  if (!type) {
    return 'Image'
  }

  const lower = String(type).toLowerCase()
  if (lower === 'before') {
    return 'Before'
  }
  if (lower === 'after') {
    return 'After'
  }
  return 'Service Photo'
}
