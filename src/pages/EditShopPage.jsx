import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateShop, getShopById } from '../api/shops'
import VendorPortalLayout from '../components/VendorPortalLayout'
import './MyShopsPage.css'

function EditShopPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { salonId } = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingShop, setLoadingShop] = useState(true)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  
  const [shopData, setShopData] = useState({
    name: '',
    description: '',
    category: 'salon',
    address: {
      street: '',
      suite: '',
      city: '',
      state: '',
      zipCode: ''
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
    }
  })

  // Redirect if not authenticated or not a vendor
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      navigate('/login')
    }
  }, [isAuthenticated, user, navigate])

  // Load existing shop data
  useEffect(() => {
    const loadShopData = async () => {
      if (!salonId) return

      try {
        setLoadingShop(true)
        console.log('🔍 Loading shop data for salon ID:', salonId)
        
        const response = await getShopById(salonId)
        
        if (response.error || !response.salon) {
          setErrors({ general: 'Shop not found or you do not have permission to edit it.' })
          setLoadingShop(false)
          return
        }
        
        const salon = response.salon
        
        // Check if user owns this salon
        if (salon.vendor?.id !== user?.user_id && salon.vendor_id !== user?.user_id) {
          setErrors({ general: 'You do not have permission to edit this shop.' })
          setLoadingShop(false)
          return
        }

        // Map backend salon data to frontend form format
        setShopData({
          name: salon.name || '',
          description: salon.description || '',
          category: salon.business_type || 'salon',
          address: {
            street: salon.address?.line1 || '',
            suite: salon.address?.line2 || '',
            city: salon.address?.city || '',
            state: salon.address?.state || '',
            zipCode: salon.address?.postal_code || ''
          },
          phone: salon.phone || '',
          email: salon.email || '',
          website: salon.website || '',
          hours: shopData.hours // Keep default hours for now
        })

        console.log('✅ Loaded shop data:', salon)
      } catch (error) {
        console.error('❌ Error loading shop:', error)
        setErrors({ general: 'Failed to load shop data. Please try again.' })
      } finally {
        setLoadingShop(false)
      }
    }

    loadShopData()
  }, [salonId, user?.user_id])

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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
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

  const validateForm = () => {
    const newErrors = {}
    
    if (!shopData.name.trim()) {
      newErrors.name = 'Shop name is required'
    }
    
    if (!shopData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required'
    }
    
    if (!shopData.address.city.trim()) {
      newErrors['address.city'] = 'City is required'
    }
    
    if (!shopData.address.state.trim()) {
      newErrors['address.state'] = 'State is required'
    }
    
    if (!shopData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required'
    }
    
    if (shopData.phone && !/^\+?[\d\s\-\(\)]+$/.test(shopData.phone)) {
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
    setSuccessMessage('')
    
    try {
      console.log('🔄 Updating shop with data:', shopData)
      
      const response = await updateShop(salonId, {
        ...shopData,
        vendor_id: user.user_id
      })
      
      console.log('✅ Shop updated successfully:', response)
      setSuccessMessage('Shop updated successfully!')
      
      // Redirect back to My Shops after a short delay
      setTimeout(() => {
        navigate('/shops')
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error updating shop:', error)
      setErrors({ 
        general: error.message || 'Failed to update shop. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'vendor') {
    return null
  }

  if (loadingShop) {
    return (
      <VendorPortalLayout activeKey="shopInfo">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading shop data...</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Salon ID: {salonId} | User ID: {user?.user_id}
          </p>
        </div>
      </VendorPortalLayout>
    )
  }

  if (errors.general) {
    return (
      <VendorPortalLayout activeKey="shopInfo">
        <div className="error-state">
          <h2>Error Loading Shop</h2>
          <p>{errors.general}</p>
          <button 
            onClick={() => navigate('/shops')} 
            className="button secondary"
          >
            Back to My Shops
          </button>
        </div>
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="shopInfo">
      <div className="shop-form-container">
        <div className="shop-form-header">
          <h1>Edit Shop</h1>
          <p>Update your business information to attract more clients</p>
        </div>

        {errors.general && (
          <div className="error-message">
            {errors.general}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="shop-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">
                Shop Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={shopData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter your shop name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={shopData.description}
                onChange={handleInputChange}
                placeholder="Describe your shop and services..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Business Type</label>
              <select
                id="category"
                name="category"
                value={shopData.category}
                onChange={handleInputChange}
              >
                <option value="salon">Hair Salon</option>
                <option value="barbershop">Barbershop</option>
                <option value="spa">Spa</option>
                <option value="beauty">Beauty Salon</option>
              </select>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address</h3>
            
            <div className="form-group">
              <label htmlFor="address.street">
                Street Address <span className="required">*</span>
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={shopData.address.street}
                onChange={handleInputChange}
                className={errors['address.street'] ? 'error' : ''}
                placeholder="123 Main Street"
              />
              {errors['address.street'] && <span className="error-text">{errors['address.street']}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address.suite">Suite/Unit (Optional)</label>
              <input
                type="text"
                id="address.suite"
                name="address.suite"
                value={shopData.address.suite}
                onChange={handleInputChange}
                placeholder="Suite 100"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address.city">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={shopData.address.city}
                  onChange={handleInputChange}
                  className={errors['address.city'] ? 'error' : ''}
                  placeholder="City"
                />
                {errors['address.city'] && <span className="error-text">{errors['address.city']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address.state">
                  State <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={shopData.address.state}
                  onChange={handleInputChange}
                  className={errors['address.state'] ? 'error' : ''}
                  placeholder="NY"
                />
                {errors['address.state'] && <span className="error-text">{errors['address.state']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address.zipCode">
                  ZIP Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={shopData.address.zipCode}
                  onChange={handleInputChange}
                  className={errors['address.zipCode'] ? 'error' : ''}
                  placeholder="12345"
                />
                {errors['address.zipCode'] && <span className="error-text">{errors['address.zipCode']}</span>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shopData.phone}
                onChange={handleInputChange}
                className={errors.phone ? 'error' : ''}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={shopData.email}
                onChange={handleInputChange}
                placeholder="shop@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={shopData.website}
                onChange={handleInputChange}
                placeholder="https://www.yourshop.com"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/shops')}
              className="button secondary"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Updating...
                </>
              ) : (
                'Update Shop'
              )}
            </button>
          </div>
        </form>
      </div>
    </VendorPortalLayout>
  )
}

export default EditShopPage