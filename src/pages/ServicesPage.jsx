import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createService, deleteService, getServicesBySalon, updateService } from '../api/services'
import { getMyShops } from '../api/shops'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import { useAuth } from '../context/AuthContext'
import './services.css'

function ServicesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshActivity } = useAuth()
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: '',
    duration_minutes: ''
  })

  // Refresh user activity when page is accessed
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load vendor's shops on mount (for vendors)
  useEffect(() => {
    if (user?.id) {
      if (user.role === 'vendor') {
        loadShops()
      } else if (user.role === 'client') {
        // For clients, show recently viewed salons or allow browsing
        loadShops()
      }
    }
  }, [user])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        // Auto-select first shop if available
        if (response.salons.length > 0 && !selectedShop) {
          loadServices(response.salons[0].id)
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load shops')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopChange = (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    if (shop) {
      setSelectedShop(shop)
      loadServices(shopId)
      setShowAddForm(false)
      setShowEditForm(false)
      setSelectedService(null)
      setSaveMessage('')
    }
  }

  const loadServices = async (salonId) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getServicesBySalon(salonId)
      setServices(data)
    } catch (err) {
      setError(err.message || 'Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault()
    if (!selectedShop) {
      setError('Please select a shop first')
      return
    }

    // Validate required fields
    if (!formData.name.trim() || !formData.price_cents || !formData.duration_minutes) {
      setError('Name, price, and duration are required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const servicePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_cents: parseInt(formData.price_cents),
        duration_minutes: parseInt(formData.duration_minutes)
      }

      await createService(selectedShop.id, servicePayload)
      setSaveMessage('Service created successfully!')
      setFormData({ name: '', description: '', price_cents: '', duration_minutes: '' })
      setShowAddForm(false)
      await loadServices(selectedShop.id)

      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price_cents: service.price_cents,
      duration_minutes: service.duration_minutes
    })
    setShowEditForm(true)
  }

  const handleEditServiceSubmit = async (e) => {
    e.preventDefault()
    if (!selectedService || !selectedShop) {
      setError('Missing service or shop information')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const servicePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_cents: parseInt(formData.price_cents),
        duration_minutes: parseInt(formData.duration_minutes)
      }

      await updateService(selectedShop.id, selectedService.id, servicePayload)
      setSaveMessage('Service updated successfully!')
      setFormData({ name: '', description: '', price_cents: '', duration_minutes: '' })
      setShowEditForm(false)
      setSelectedService(null)
      await loadServices(selectedShop.id)

      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!selectedShop || !window.confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await deleteService(selectedShop.id, serviceId)
      setSaveMessage('Service deleted successfully!')
      await loadServices(selectedShop.id)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete service')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (priceCents) => {
    return (priceCents / 100).toFixed(2)
  }

  if (isLoading && shops.length === 0) {
    return (
      <VendorPortalLayout activeKey="services">
        <VendorLoadingState message="Loading your services..." />
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="services">
      <div className="services-page">
        <div className="services-container">
        <h1>Services</h1>

        {error && <div className="error-message">{error}</div>}
        {saveMessage && <div className="success-message">{saveMessage}</div>}

        <div className="shop-selector">
          <label htmlFor="shop-select">Select Shop:</label>
          <select
            id="shop-select"
            value={selectedShop?.id || ''}
            onChange={(e) => handleShopChange(parseInt(e.target.value))}
          >
            <option value="">-- Select a shop --</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>

        {selectedShop && (
          <>
            <div className="services-header">
              <h2>{selectedShop.name} - Services</h2>
              {user?.role === 'vendor' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowAddForm(!showAddForm)
                    setShowEditForm(false)
                    setSelectedService(null)
                    setFormData({ name: '', description: '', price_cents: '', duration_minutes: '' })
                  }}
                >
                  {showAddForm ? 'Cancel' : 'Add Service'}
                </button>
              )}
            </div>

            {/* Add Service Form */}
            {showAddForm && user?.role === 'vendor' && (
              <form onSubmit={handleAddServiceSubmit} className="service-form">
                <h3>Add New Service</h3>
                <div className="form-group">
                  <label htmlFor="name">Service Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Haircut, Coloring"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Service description"
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price ($) *</label>
                    <input
                      id="price"
                      type="number"
                      name="price_cents"
                      value={formData.price_cents}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration">Duration (minutes) *</label>
                    <input
                      id="duration"
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Service'}
                </button>
              </form>
            )}

            {/* Edit Service Form */}
            {showEditForm && selectedService && user?.role === 'vendor' && (
              <form onSubmit={handleEditServiceSubmit} className="service-form">
                <h3>Edit Service</h3>
                <div className="form-group">
                  <label htmlFor="edit-name">Service Name *</label>
                  <input
                    id="edit-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-price">Price ($) *</label>
                    <input
                      id="edit-price"
                      type="number"
                      name="price_cents"
                      value={formData.price_cents}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-duration">Duration (minutes) *</label>
                    <input
                      id="edit-duration"
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Update Service'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditForm(false)
                      setSelectedService(null)
                      setFormData({ name: '', description: '', price_cents: '', duration_minutes: '' })
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Services List */}
            <div className="services-list">
              {isLoading && shops.length > 0 && (
                <VendorLoadingState message="Updating services..." compact />
              )}
              {!isLoading && services.length === 0 && (
                <p className="no-services">No services found. {user?.role === 'vendor' && 'Add one to get started!'}</p>
              )}
              {!isLoading && services.length > 0 && (
                <div className="services-grid">
                  {services.map(service => (
                    <div key={service.id} className="service-card">
                      <div className="service-header">
                        <h3>{service.name}</h3>
                        {user?.role === 'vendor' && (
                          <div className="service-actions">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditClick(service)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {service.description && (
                        <p className="service-description">{service.description}</p>
                      )}
                      <div className="service-details">
                        <span className="service-price">${formatPrice(service.price_cents)}</span>
                        <span className="service-duration">{service.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </VendorPortalLayout>
  )
}

export default ServicesPage
