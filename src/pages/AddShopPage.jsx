import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createShop } from '../api/shops'
import Header from '../components/Header'
import './MyShopsPage.css'

function AddShopPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [shopData, setShopData] = useState({
    name: '',
    description: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: ''
    },
    phone: '',
    email: '',
    website: '',
    hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    },
    services: [],
    images: []
  })

  // Redirect if not authenticated or not a vendor
  if (!isAuthenticated || user?.role !== 'vendor') {
    navigate('/login')
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1]
      setShopData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setShopData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleHoursChange = (day, field, value) => {
    setShopData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    // Validate files
    const validFiles = []
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          images: `File ${file.name} is not a supported image format. Please use JPEG, PNG, or WebP.`
        }))
        continue
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          images: `File ${file.name} is too large. Please use images smaller than 5MB.`
        }))
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    // Clear previous image errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.images
      return newErrors
    })
    
    // Process valid files
    const processedImages = []
    
    for (const file of validFiles) {
      try {
        // Create preview URL
        const preview = URL.createObjectURL(file)
        
        // Convert to base64 for API submission (optional)
        const base64 = await fileToBase64(file)
        
        processedImages.push({
          file,
          preview,
          base64,
          name: file.name,
          size: file.size,
          type: file.type
        })
      } catch (error) {
        console.error('Error processing image:', error)
        setErrors(prev => ({
          ...prev,
          images: `Failed to process ${file.name}. Please try again.`
        }))
      }
    }
    
    setShopData(prev => ({
      ...prev,
      images: [...prev.images, ...processedImages]
    }))
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const removeImage = (index) => {
    setShopData(prev => {
      const imageToRemove = prev.images[index]
      
      // Clean up preview URL to prevent memory leaks
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }
    })
  }

  // Clean up preview URLs when component unmounts
  useState(() => {
    return () => {
      shopData.images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview)
        }
      })
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!shopData.name.trim()) newErrors.name = 'Salon name is required'
    if (!shopData.address.line1.trim()) newErrors['address.line1'] = 'Street address is required'
    if (!shopData.address.city.trim()) newErrors['address.city'] = 'City is required'
    if (!shopData.address.state.trim()) newErrors['address.state'] = 'State is required'
    if (!shopData.address.postalCode.trim()) newErrors['address.postalCode'] = 'Postal code is required'
    if (!shopData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!shopData.email.trim()) newErrors.email = 'Email is required'

    // Email validation
    if (shopData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation (basic)
    if (shopData.phone && !/^[\d\s\-\+\(\)]+$/.test(shopData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Prepare shop data for API submission
      const submissionData = {
        name: shopData.name,
        description: shopData.description,
        category: shopData.category || 'salon',
        vendor_id: user.id,
        address: {
          street: shopData.address.line1,
          suite: shopData.address.line2,
          city: shopData.address.city,
          state: shopData.address.state,
          zipCode: shopData.address.postalCode
        },
        phone: shopData.phone,
        email: shopData.email,
        website: shopData.website,
        hours: shopData.hours,
        services: shopData.services,
        images: shopData.images
      }

      console.log('Submitting shop data:', submissionData)
      const response = await createShop(submissionData)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      // Success - redirect to my shops
      navigate('/shops', { 
        state: { 
          message: 'Your salon has been registered successfully! It is now under review and will be published once approved.',
          shopId: response.salon?.id
        }
      })
    } catch (error) {
      console.error('Error submitting shop:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to register salon. Please try again.'
      
      if (error.message === 'invalid_payload') {
        errorMessage = 'Please check all required fields and try again.'
      } else if (error.message === 'invalid_vendor') {
        errorMessage = 'Your account is not authorized to create salons.'
      } else if (error.message === 'database_error') {
        errorMessage = 'Service temporarily unavailable. Please try again later.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setErrors({ 
        submit: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/shops')
  }

  return (
    <div className="page">
      <Header showSearch={false} />
      
      <main className="main-content">
        <div className="container">
          <div className="add-shop-header">
            <h1>Register Your Salon</h1>
            <p>Fill out the information below to list your salon on our platform</p>
          </div>

          <form className="shop-form" onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="name" className="form-label required">
                    Salon Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={shopData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your salon name"
                    disabled={loading}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={shopData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Describe your salon and services..."
                    rows="3"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="form-section">
              <h2>Address</h2>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="address.line1" className="form-label required">
                    Street Address
                  </label>
                  <input
                    id="address.line1"
                    name="address.line1"
                    type="text"
                    value={shopData.address.line1}
                    onChange={handleInputChange}
                    className={`form-input ${errors['address.line1'] ? 'error' : ''}`}
                    placeholder="123 Main Street"
                    disabled={loading}
                  />
                  {errors['address.line1'] && <span className="form-error">{errors['address.line1']}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address.line2" className="form-label">
                    Address Line 2
                  </label>
                  <input
                    id="address.line2"
                    name="address.line2"
                    type="text"
                    value={shopData.address.line2}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Suite, apartment, etc. (optional)"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.city" className="form-label required">
                    City
                  </label>
                  <input
                    id="address.city"
                    name="address.city"
                    type="text"
                    value={shopData.address.city}
                    onChange={handleInputChange}
                    className={`form-input ${errors['address.city'] ? 'error' : ''}`}
                    placeholder="New York"
                    disabled={loading}
                  />
                  {errors['address.city'] && <span className="form-error">{errors['address.city']}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="address.state" className="form-label required">
                    State
                  </label>
                  <input
                    id="address.state"
                    name="address.state"
                    type="text"
                    value={shopData.address.state}
                    onChange={handleInputChange}
                    className={`form-input ${errors['address.state'] ? 'error' : ''}`}
                    placeholder="NY"
                    disabled={loading}
                  />
                  {errors['address.state'] && <span className="form-error">{errors['address.state']}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="address.postalCode" className="form-label required">
                    Postal Code
                  </label>
                  <input
                    id="address.postalCode"
                    name="address.postalCode"
                    type="text"
                    value={shopData.address.postalCode}
                    onChange={handleInputChange}
                    className={`form-input ${errors['address.postalCode'] ? 'error' : ''}`}
                    placeholder="10001"
                    disabled={loading}
                  />
                  {errors['address.postalCode'] && <span className="form-error">{errors['address.postalCode']}</span>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h2>Contact Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label required">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={shopData.phone}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="(555) 123-4567"
                    disabled={loading}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label required">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={shopData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="salon@example.com"
                    disabled={loading}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="website" className="form-label">
                    Website (Optional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={shopData.website}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://yourwebsite.com"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Hours of Operation */}
            <div className="form-section">
              <h2>Hours of Operation</h2>
              
              <div className="hours-grid">
                {Object.entries(shopData.hours).map(([day, hours]) => (
                  <div key={day} className="hours-row">
                    <div className="day-name">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </div>
                    
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                        disabled={loading}
                      />
                      <span className="checkmark"></span>
                      Closed
                    </label>
                    
                    {!hours.closed && (
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className="form-input time-input"
                          disabled={loading}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className="form-input time-input"
                          disabled={loading}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Images Upload */}
            <div className="form-section">
              <h2>Shop Images</h2>
              <p className="form-description">
                Upload photos of your salon to attract more customers. You can upload up to 10 images.
              </p>
              
              <div className="image-upload-container">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                  disabled={loading || shopData.images.length >= 10}
                />
                
                <label htmlFor="images" className={`image-upload-label ${shopData.images.length >= 10 ? 'disabled' : ''}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {shopData.images.length >= 10 ? 'Maximum images reached' : 'Click to upload images'}
                </label>
              </div>

              {shopData.images.length > 0 && (
                <div className="image-preview-grid">
                  {shopData.images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img src={image.preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Section */}
            <div className="form-section">
              {errors.submit && (
                <div className="form-error-box">
                  {errors.submit}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={loading}
                >
                  {loading ? 'Publishing Salon...' : 'Publish Salon'}
                </button>
              </div>

              <div className="form-note">
                <p>
                  <strong>Note:</strong> Your salon will be reviewed by our team before being published. 
                  This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default AddShopPage