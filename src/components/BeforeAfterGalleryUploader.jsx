import { useState, useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  deleteAppointmentImage,
  getAppointmentImages,
  uploadAppointmentImage,
} from '../api/images'
import { formatImageTypeLabel, resolveAppointmentImageUrl } from '../utils/imageUrls'
import '../styles/before-after-gallery.css'

export default function BeforeAfterGalleryUploader({ appointmentId, onImagesUpdated, readOnly = false }) {
  const [images, setImages] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadType, setUploadType] = useState('before')
  const [uploadDescription, setUploadDescription] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  // Load images for this appointment
  const loadImages = useCallback(async () => {
    if (!appointmentId) return

    try {
      setLoading(true)
      setError(null)
      const response = await getAppointmentImages(appointmentId)
      console.log('Raw API response:', response)
      
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
      
      console.log('Enhanced response:', enhanced)
      setImages(enhanced)
    } catch (err) {
      setError('Failed to load gallery images')
      console.error('Error loading images:', err)
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  // Auto-load images when appointmentId changes
  useEffect(() => {
    if (appointmentId) {
      loadImages()
    }
  }, [loadImages])

  // Validate and process file
  const processFile = (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setUploadFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add('drag-over')
  }

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('drag-over')
  }

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('drag-over')
    
    const file = e.dataTransfer?.files?.[0]
    processFile(file)
  }

  // Upload image
  const handleUpload = async (e) => {
    e.preventDefault()

    if (!uploadFile) {
      setError('Please select an image')
      return
    }

    if (!appointmentId) {
      setError('Appointment ID is required')
      return
    }

    try {
      setUploading(true)
      setError(null)
      
      await uploadAppointmentImage(
        appointmentId,
        uploadFile,
        uploadType,
        uploadDescription
      )

      setSuccess(`${formatImageTypeLabel(uploadType)} image uploaded successfully!`)
      
      // Reset form
      setUploadFile(null)
      setPreviewUrl(null)
      setUploadDescription('')
      setUploadType('before')

      // Reload images
      await loadImages()
      
      // Notify parent
      if (onImagesUpdated) {
        onImagesUpdated()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to upload image')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  // Delete image
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await deleteAppointmentImage(appointmentId, imageId)
      
      setSuccess('Image deleted successfully')
      await loadImages()

      if (onImagesUpdated) {
        onImagesUpdated()
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Gallery item component
  const GalleryItem = ({ image, type }) => {
    const imageUrl = image.resolvedUrl || image.image_url
    console.log('GalleryItem rendering with image:', {
      id: image.id,
      image_url: image.image_url,
      resolvedUrl: image.resolvedUrl,
      finalUrl: imageUrl,
      type: image.image_type || type,
    })
    
    return (
    <div className="gallery-item" data-type={type}>
      <div className="image-badge">{formatImageTypeLabel(image.image_type || image.type)}</div>
      
      <img
        src={imageUrl}
        alt={`${formatImageTypeLabel(image.image_type || image.type)} - ${image.description || 'Service photo'}`}
        loading="lazy"
        onError={(e) => {
          console.error('Image failed to load:', imageUrl)
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" dy=".3em" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E'
        }}
      />
      
      <div className="image-info">
        {image.description && <p className="image-description">{image.description}</p>}
        
        <p className="image-date">
          {new Date(image.uploaded_at || image.created_at).toLocaleDateString()}
        </p>
        
        {!readOnly && (
          <button
            className="delete-btn"
            onClick={() => handleDeleteImage(image.id || image.image_id)}
            disabled={loading}
            title="Delete this image"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
    )
  }

  GalleryItem.propTypes = {
    image: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      image_type: PropTypes.string,
      description: PropTypes.string,
      uploaded_at: PropTypes.string,
      created_at: PropTypes.string,
      image_url: PropTypes.string,
      resolvedUrl: PropTypes.string,
    }).isRequired,
    type: PropTypes.string.isRequired,
  }

  if (!appointmentId) {
    return (
      <div className="gallery-uploader">
        <div className="empty-state">
          <p>No appointment selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-uploader">
      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Upload Form (unless readOnly) */}
      {!readOnly && (
        <div className="upload-panel">
          <h3>📸 Upload Transformation Photos</h3>
          <p className="upload-description">
            Share before and after images to showcase the service results
          </p>

          <form onSubmit={handleUpload} className="upload-form">
            {/* Image Type Selection */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image-type">Image Type *</label>
                <select
                  id="image-type"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  disabled={uploading}
                  required
                >
                  <option value="before">Before Service</option>
                  <option value="after">After Service</option>
                </select>
              </div>

              {/* File Input */}
              <div className="form-group">
                <label htmlFor="image-file">Select Image *</label>
                <div 
                  className="file-input-wrapper"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <input
                    ref={fileInputRef}
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <span className="file-name">
                    {uploadFile?.name ? `✓ ${uploadFile.name}` : '📁 Click or drag image here'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label htmlFor="image-description">Description (Optional)</label>
              <textarea
                id="image-description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Describe the results, any notes about the service, or specific details about the transformation..."
                rows="3"
                disabled={uploading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="upload-btn"
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
        </div>
      )}

      {/* Gallery Display */}
      <div className="gallery-display">
        <div className="gallery-header">
          <h3>📸 Transformation Gallery</h3>
          {images && (
            <span className="image-count">
              Total: {images.total_images || 0} image{images.total_images !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && !images && (
          <div className="loading-spinner">
            <p>Loading images...</p>
          </div>
        )}

        {images && images.total_images === 0 ? (
          <div className="empty-state">
            <p>No images yet</p>
            {!readOnly && <p className="hint">Upload before and after photos to get started</p>}
          </div>
        ) : (
          images && (
            <>
              {/* Before Images */}
              {images.images_by_type?.before && images.images_by_type.before.length > 0 && (
                <div className="gallery-section">
                  <h4 className="section-title before-title">
                    📷 Before ({images.images_by_type.before.length})
                  </h4>
                  <div className="gallery-grid">
                    {images.images_by_type.before.map((img) => (
                      <GalleryItem key={img.id} image={img} type="before" />
                    ))}
                  </div>
                </div>
              )}

              {/* After Images */}
              {images.images_by_type?.after && images.images_by_type.after.length > 0 && (
                <div className="gallery-section">
                  <h4 className="section-title after-title">
                    ✨ After ({images.images_by_type.after.length})
                  </h4>
                  <div className="gallery-grid">
                    {images.images_by_type.after.map((img) => (
                      <GalleryItem key={img.id} image={img} type="after" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Load Images Button (for initial load) */}
      {!images && !loading && (
        <div className="action-buttons">
          <button
            className="load-btn"
            onClick={loadImages}
            disabled={loading}
          >
            Load Gallery
          </button>
        </div>
      )}
    </div>
  )
}

BeforeAfterGalleryUploader.propTypes = {
  appointmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onImagesUpdated: PropTypes.func,
  readOnly: PropTypes.bool,
}
