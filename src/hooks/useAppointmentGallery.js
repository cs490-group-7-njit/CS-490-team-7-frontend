import { useCallback, useEffect, useState } from 'react'
import { getAppointmentImages } from '../api/images'
import { resolveAppointmentImageUrl } from '../utils/imageUrls'

/**
 * Custom hook for managing appointment gallery images
 * @param {number|string} appointmentId - The appointment ID
 * @returns {Object} Gallery state and methods
 */
export function useAppointmentGallery(appointmentId) {
  const [images, setImages] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadImages = useCallback(async () => {
    if (!appointmentId) {
      setImages(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await getAppointmentImages(appointmentId)

      // Enhance response with resolved URLs
      const enhanced = {
        ...response,
        images: (response.images || []).map((img) => ({
          ...img,
          resolvedUrl: resolveAppointmentImageUrl(img),
        })),
        images_by_type: {
          before: (response.images_by_type?.before || []).map((img) => ({
            ...img,
            resolvedUrl: resolveAppointmentImageUrl(img),
          })),
          after: (response.images_by_type?.after || []).map((img) => ({
            ...img,
            resolvedUrl: resolveAppointmentImageUrl(img),
          })),
          other: (response.images_by_type?.other || []).map((img) => ({
            ...img,
            resolvedUrl: resolveAppointmentImageUrl(img),
          })),
        },
      }

      setImages(enhanced)
    } catch (err) {
      setError(err.message || 'Failed to load images')
      console.error('Error loading gallery images:', err)
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  return {
    images,
    loading,
    error,
    reload: loadImages,
  }
}
