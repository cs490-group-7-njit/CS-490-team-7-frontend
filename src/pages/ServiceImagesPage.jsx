import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  deleteAppointmentImage,
  getAppointmentImages,
  getServiceImages,
  uploadAppointmentImage,
} from '../api/images'
import { getSalons } from '../api/staff'
import { useAuth } from '../context/AuthContext'
import { formatImageTypeLabel, resolveAppointmentImageUrl } from '../utils/imageUrls'
import '../pages/service-images.css'

export default function ServiceImagesPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialQueryRef = useRef({
    appointmentId: searchParams.get('appointmentId') || '',
    serviceId: searchParams.get('serviceId') || '',
    salonId: searchParams.get('salonId'),
    view: searchParams.get('view'),
  })
  const [salons, setSalons] = useState([])
  const [selectedSalonId, setSelectedSalonId] = useState(initialQueryRef.current.salonId)
  const [appointmentId, setAppointmentId] = useState(initialQueryRef.current.appointmentId)
  const [serviceId, setServiceId] = useState(initialQueryRef.current.serviceId)
  const [images, setImages] = useState(null)
  const [serviceImages, setServiceImages] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadType, setUploadType] = useState('before')
  const [uploadDescription, setUploadDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState(() => {
    const preset = initialQueryRef.current.view
    return preset === 'gallery' || preset === 'service' ? preset : 'upload'
  }) // 'upload', 'gallery', 'service'
  const hasAppliedInitialQuery = useRef(false)

  const enhanceGalleryResponse = useCallback((data) => {
    if (!data) {
      return null
    }

    const attachUrl = (items = []) =>
      items.map((img) => ({
        ...img,
        resolvedUrl: resolveAppointmentImageUrl(img),
      }))

    return {
      ...data,
      images: attachUrl(data.images || []),
      images_by_type: {
        before: attachUrl(data.images_by_type?.before || []),
        after: attachUrl(data.images_by_type?.after || []),
        other: attachUrl(data.images_by_type?.other || []),
      },
    }
  }, [])

  const loadAppointmentImages = useCallback(async (targetAppointmentId) => {
    const effectiveAppointmentId = targetAppointmentId ?? appointmentId
    if (!effectiveAppointmentId) {
      return
    }
    try {
      setLoading(true)
      const response = await getAppointmentImages(effectiveAppointmentId)
      setImages(enhanceGalleryResponse(response))
    } catch (err) {
      setError('Failed to load images')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [appointmentId, enhanceGalleryResponse])

  const loadServiceImages = useCallback(async (targetServiceId) => {
    const effectiveServiceId = targetServiceId ?? serviceId
    if (!effectiveServiceId) {
      return
    }
    try {
      setLoading(true)
      const response = await getServiceImages(effectiveServiceId)
      setServiceImages(enhanceGalleryResponse(response))
    } catch (err) {
      setError('Failed to load service images')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [enhanceGalleryResponse, serviceId])

  // Load salons on mount
  useEffect(() => {
    if (user?.role === 'vendor') {
      loadSalons(user.id, initialQueryRef.current.salonId)
    } else {
      setSalons([])
      setSelectedSalonId(null)
    }
  }, [user])

  useEffect(() => {
    if (hasAppliedInitialQuery.current) {
      return
    }

    hasAppliedInitialQuery.current = true
    const { view, appointmentId: queryAppointmentId, serviceId: queryServiceId } = initialQueryRef.current

    if (view === 'gallery' && queryAppointmentId) {
      loadAppointmentImages(queryAppointmentId)
    } else if (view === 'service' && queryServiceId) {
      loadServiceImages(queryServiceId)
    }
  }, [loadAppointmentImages, loadServiceImages])

  const loadSalons = async (vendorId, preferredSalonId) => {
    try {
      setLoading(true)
      const { salons: salonList = [] } = await getSalons(vendorId)
      setSalons(salonList)
      if (salonList.length > 0) {
        const normalizedPreferred = preferredSalonId != null ? String(preferredSalonId) : null
        const matchingSalon = normalizedPreferred
          ? salonList.find((salon) => String(salon.id ?? salon.salon_id) === normalizedPreferred)
          : null

        if (matchingSalon) {
          const matchId = matchingSalon.id ?? matchingSalon.salon_id
          setSelectedSalonId(matchId != null ? String(matchId) : null)
        } else {
          const firstSalon = salonList[0]
          const fallbackId = firstSalon?.id ?? firstSalon?.salon_id
          setSelectedSalonId(fallbackId != null ? String(fallbackId) : null)
        }
      } else {
        setSelectedSalonId(null)
      }
    } catch (err) {
      setError('Failed to load salons')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file')
      return
    }

    if (!appointmentId) {
      setError('Please enter an appointment ID')
      return
    }

    try {
      setLoading(true)
      await uploadAppointmentImage(
        appointmentId,
        uploadFile,
        uploadType,
        uploadDescription
      )

      // Refresh images
      if (appointmentId) {
        await loadAppointmentImages()
      }

      // Reset form
      setUploadFile(null)
      setUploadDescription('')
      setUploadType('before')
      setError(null)
    } catch (err) {
      setError('Failed to upload image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!appointmentId || !imageId) return

    if (!window.confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      setLoading(true)
      await deleteAppointmentImage(appointmentId, imageId)
      await loadAppointmentImages()
    } catch (err) {
      setError('Failed to delete image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAppointmentGallery = async () => {
    if (!appointmentId) {
      setError('Please enter an appointment ID')
      return
    }
    setViewMode('gallery')
    await loadAppointmentImages()
  }

  const handleViewServiceGallery = async () => {
    if (!serviceId) {
      setError('Please enter a service ID')
      return
    }
    setViewMode('service')
    await loadServiceImages()
  }

  if (loading && !images && !serviceImages) {
    return <div className="service-images-container"><p>Loading...</p></div>
  }

  return (
    <div className="service-images-container">
      <h1>Service Images Gallery</h1>

      {/* Salon Selector */}
      <div className="salon-selector">
        <label htmlFor="salon-select">Select Shop:</label>
        <select
          id="salon-select"
          value={selectedSalonId || ''}
          onChange={(e) => {
            const { value } = e.target
            setSelectedSalonId(value || null)
          }}
        >
          <option value="">-- Choose a shop --</option>
          {salons.map((salon) => (
            <option key={salon.id ?? salon.salon_id} value={salon.id ?? salon.salon_id}>
              {salon.name || salon.salon_name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {selectedSalonId && (
        <>
          {/* View Mode Tabs */}
          <div className="view-mode-tabs">
            <button
              className={`tab-button ${viewMode === 'upload' ? 'active' : ''}`}
              onClick={() => setViewMode('upload')}
            >
              Upload Images
            </button>
            <button
              className={`tab-button ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={handleViewAppointmentGallery}
            >
              Appointment Gallery
            </button>
            <button
              className={`tab-button ${viewMode === 'service' ? 'active' : ''}`}
              onClick={handleViewServiceGallery}
            >
              Service Portfolio
            </button>
          </div>

          {/* Upload Tab */}
          {viewMode === 'upload' && (
            <div className="upload-section">
              <h2>Upload Service Images</h2>

              <div className="upload-form">
                <div className="form-group">
                  <label htmlFor="appointment-id">Appointment ID:</label>
                  <input
                    id="appointment-id"
                    type="number"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    placeholder="Enter appointment ID"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image-type">Image Type:</label>
                  <select
                    id="image-type"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                  >
                    <option value="before">Before Service</option>
                    <option value="after">After Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="image-file">Image File:</label>
                  <div className="file-input-wrapper">
                    <input
                      id="image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <span className="file-name">
                      {uploadFile ? uploadFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="image-description">Description (Optional):</label>
                  <textarea
                    id="image-description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Describe the image, results, or any notes..."
                    rows="4"
                  />
                </div>

                <button
                  className="upload-btn"
                  onClick={handleUpload}
                  disabled={loading || !uploadFile || !appointmentId}
                >
                  {loading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>
          )}

          {/* Appointment Gallery Tab */}
          {viewMode === 'gallery' && (
            <div className="gallery-section">
              <h2>Appointment Gallery</h2>

              <div className="gallery-controls">
                <div className="appointment-search">
                  <label htmlFor="apt-id">Appointment ID:</label>
                  <input
                    id="apt-id"
                    type="number"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                  />
                  <button
                    className="search-btn"
                    onClick={loadAppointmentImages}
                    disabled={loading || !appointmentId}
                  >
                    {loading ? 'Loading...' : 'Load Images'}
                  </button>
                </div>
              </div>

              {images && (
                <div className="gallery-content">
                  <div className="image-count">
                    Total Images: <strong>{images.total_images}</strong>
                  </div>

                  {images.images_by_type && (
                    <>
                      {/* Before Images */}
                      {images.images_by_type.before && images.images_by_type.before.length > 0 && (
                        <div className="image-section">
                          <h3>Before Service ({images.images_by_type.before.length})</h3>
                          <div className="gallery-grid">
                            {images.images_by_type.before.map((img) => (
                              <div key={img.id} className="gallery-item before">
                                <div className="image-badge">{formatImageTypeLabel(img.type)}</div>
                                <img
                                  src={img.resolvedUrl}
                                  alt={`Before - ${img.description || 'Service photo'}`}
                                />
                                <div className="image-info">
                                  <p className="image-description">{img.description || 'No description'}</p>
                                    <p className="image-date">
                                      {new Date(img.uploaded_at).toLocaleDateString()}
                                    </p>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(img.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* After Images */}
                      {images.images_by_type.after && images.images_by_type.after.length > 0 && (
                        <div className="image-section">
                          <h3>After Service ({images.images_by_type.after.length})</h3>
                          <div className="gallery-grid">
                            {images.images_by_type.after.map((img) => (
                              <div key={img.id} className="gallery-item after">
                                <div className="image-badge">{formatImageTypeLabel(img.type)}</div>
                                <img
                                  src={img.resolvedUrl}
                                  alt={`After - ${img.description || 'Service photo'}`}
                                />
                                <div className="image-info">
                                  <p className="image-description">{img.description || 'No description'}</p>
                                    <p className="image-date">
                                      {new Date(img.uploaded_at).toLocaleDateString()}
                                    </p>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(img.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Images */}
                      {images.images_by_type.other && images.images_by_type.other.length > 0 && (
                        <div className="image-section">
                          <h3>Other Images ({images.images_by_type.other.length})</h3>
                          <div className="gallery-grid">
                            {images.images_by_type.other.map((img) => (
                              <div key={img.id} className="gallery-item other">
                                <div className="image-badge">{formatImageTypeLabel(img.type)}</div>
                                <img
                                  src={img.resolvedUrl}
                                  alt={img.description || 'Service photo'}
                                />
                                <div className="image-info">
                                  <p className="image-description">{img.description || 'No description'}</p>
                                  <p className="image-date">
                                    {new Date(img.uploaded_at).toLocaleDateString()}
                                  </p>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(img.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {images.total_images === 0 && (
                    <p className="no-data">No images found for this appointment</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Service Portfolio Tab */}
          {viewMode === 'service' && (
            <div className="service-gallery-section">
              <h2>Service Portfolio</h2>

              <div className="service-controls">
                <div className="service-search">
                  <label htmlFor="svc-id">Service ID:</label>
                  <input
                    id="svc-id"
                    type="number"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                  />
                  <button
                    className="search-btn"
                    onClick={loadServiceImages}
                    disabled={loading || !serviceId}
                  >
                    {loading ? 'Loading...' : 'Load Portfolio'}
                  </button>
                </div>
              </div>

              {serviceImages && (
                <div className="service-gallery-content">
                  <h3>{serviceImages.service_name}</h3>
                  <div className="image-count">
                    Total Portfolio Images: <strong>{serviceImages.total_images}</strong>
                  </div>

                  {serviceImages.images_by_type && (
                    <>
                      {/* Portfolio Before Images */}
                      {serviceImages.images_by_type.before && serviceImages.images_by_type.before.length > 0 && (
                        <div className="portfolio-section">
                          <h4>Before Transformations ({serviceImages.images_by_type.before.length})</h4>
                          <div className="portfolio-grid">
                            {serviceImages.images_by_type.before.map((img) => (
                              <div key={img.id} className="portfolio-item">
                                <img
                                  src={img.resolvedUrl}
                                  alt={`Before - ${img.client_name}`}
                                />
                                <div className="portfolio-info">
                                  <p className="portfolio-client">{img.client_name}</p>
                                  <p className="portfolio-description">{img.description}</p>
                                  <p className="portfolio-date">
                                    {new Date(img.appointment_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio After Images */}
                      {serviceImages.images_by_type.after && serviceImages.images_by_type.after.length > 0 && (
                        <div className="portfolio-section">
                          <h4>After Results ({serviceImages.images_by_type.after.length})</h4>
                          <div className="portfolio-grid">
                            {serviceImages.images_by_type.after.map((img) => (
                              <div key={img.id} className="portfolio-item">
                                <img
                                  src={img.resolvedUrl}
                                  alt={`After - ${img.client_name}`}
                                />
                                <div className="portfolio-info">
                                  <p className="portfolio-client">{img.client_name}</p>
                                  <p className="portfolio-description">{img.description}</p>
                                  <p className="portfolio-date">
                                    {new Date(img.appointment_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio Other Images */}
                      {serviceImages.images_by_type.other && serviceImages.images_by_type.other.length > 0 && (
                        <div className="portfolio-section">
                          <h4>Additional Images ({serviceImages.images_by_type.other.length})</h4>
                          <div className="portfolio-grid">
                            {serviceImages.images_by_type.other.map((img) => (
                              <div key={img.id} className="portfolio-item">
                                <img
                                  src={img.resolvedUrl}
                                  alt={img.client_name}
                                />
                                <div className="portfolio-info">
                                  <p className="portfolio-client">{img.client_name}</p>
                                  <p className="portfolio-description">{img.description}</p>
                                  <p className="portfolio-date">
                                    {new Date(img.appointment_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {serviceImages.total_images === 0 && (
                    <p className="no-data">No portfolio images for this service</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
