import { apiBaseURL } from '../api/http'

function isAbsoluteUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function resolveAppointmentImageUrl(image) {
  if (!image) {
    return ''
  }

  // If image is a string URL, return as-is if it's absolute
  if (typeof image === 'string') {
    if (image.startsWith('data:') || isAbsoluteUrl(image)) {
      return image
    }
    return `${apiBaseURL}/uploads/appointment_images/${image}`
  }

  // Check for direct image_url first (this is what the backend returns)
  if (image.image_url && isAbsoluteUrl(image.image_url)) {
    console.log('Using image_url from API:', image.image_url)
    return image.image_url
  }

  // Check for S3 URL
  const s3Url = image.s3_url || image.secure_url
  if (s3Url && isAbsoluteUrl(s3Url)) {
    console.log('Using s3_url:', s3Url)
    return s3Url
  }

  // Check for direct URL properties
  const directUrl = image.url || image.path
  if (directUrl) {
    if (directUrl.startsWith('data:') || isAbsoluteUrl(directUrl)) {
      return directUrl
    }
    return `${apiBaseURL}/uploads/appointment_images/${directUrl}`
  }

  // Check for filename
  const filename = image.filename || image.name
  if (!filename) {
    console.warn('No valid image URL found in image object:', image)
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
