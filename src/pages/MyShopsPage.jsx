import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyShops, submitForVerification } from '../api/shops'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import VerificationModal from '../components/VerificationModal'
import { useAuth } from '../context/AuthContext'
import './MyShopsPage.css'

function MyShopsPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    shopId: null,
    shopName: null
  })
  const [submittingVerification, setSubmittingVerification] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'vendor') {
      navigate('/dashboard')
      return
    }

    // Check for success message from navigation
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the message from history to prevent it from showing on refresh
      window.history.replaceState({}, document.title)
    }

    fetchVendorShops()
  }, [isAuthenticated, user, navigate, location.state])

  const fetchVendorShops = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getMyShops(user.id)

      if (response.error) {
        throw new Error(response.error)
      }

      // Transform backend salon data to frontend shop format
      const transformedShops = response.salons.map(salon => ({
        id: salon.id,
        name: salon.name,
        address: formatAddress(salon.address),
        status: salon.is_published ? 'published' : 'draft',
        verification_status: salon.verification_status,
        created_at: salon.created_at || new Date().toISOString(),
        description: salon.description,
        business_type: salon.business_type,
        phone: salon.phone
      }))

      setShops(transformedShops)
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError(err.message || 'Failed to load your shops')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return 'Address not provided'

    const parts = []
    if (address.line1) parts.push(address.line1)
    if (address.line2) parts.push(address.line2)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postal_code) parts.push(address.postal_code)

    return parts.join(', ') || 'Address not provided'
  }

  const handleAddNewShop = () => {
    navigate('/shops/new')
  }

  const handleEditShop = (shopId) => {
    navigate(`/shops/${shopId}/edit`)
  }

  const openVerificationModal = (shop) => {
    setVerificationModal({
      isOpen: true,
      shopId: shop.id,
      shopName: shop.name
    })
  }

  const closeVerificationModal = () => {
    setVerificationModal({
      isOpen: false,
      shopId: null,
      shopName: null
    })
  }

  const handleSubmitForVerification = async (tin) => {
    if (!verificationModal.shopId) return

    setSubmittingVerification(true)
    try {
      const response = await submitForVerification(verificationModal.shopId, tin)

      if (response.error) {
        throw new Error(response.error)
      }

      // Update the shop in local state
      setShops(shops.map(shop =>
        shop.id === verificationModal.shopId
          ? { ...shop, verification_status: 'pending' }
          : shop
      ))

      setSuccessMessage(`${verificationModal.shopName} has been submitted for verification!`)
      closeVerificationModal()
    } catch (err) {
      console.error('Verification submission error:', err)
      throw new Error(err.message || 'Failed to submit for verification')
    } finally {
      setSubmittingVerification(false)
    }
  }

  const getStatusBadge = (status, verificationStatus) => {
    if (verificationStatus === 'pending') {
      return <span className="status-badge pending">Pending Verification</span>
    }
    if (verificationStatus === 'approved' && status === 'published') {
      return <span className="status-badge published">Published</span>
    }
    if (verificationStatus === 'approved' && status === 'draft') {
      return <span className="status-badge draft">Draft</span>
    }
    if (verificationStatus === 'rejected') {
      return <span className="status-badge rejected">Verification Required</span>
    }
    return <span className="status-badge unknown">Unknown</span>
  }

  if (loading) {
    return (
      <VendorPortalLayout activeKey="shops">
        <VendorLoadingState message="Loading your shops..." />
      </VendorPortalLayout>
    )
  }

  if (error) {
    return (
      <VendorPortalLayout activeKey="shops">
        <div className="main-content">
          <div className="container">
            <div className="error-container">
              <div className="error-message">
                <h3>Unable to Load Shops</h3>
                <p>{error}</p>
                <button
                  onClick={fetchVendorShops}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="shops">
      <div className="main-content">
        <div className="container">
          {successMessage && (
            <div className="success-message">
              <div className="success-content">
                <span className="success-icon">✓</span>
                <p>{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="close-button"
                  aria-label="Close message"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="page-header">
            <div className="page-header-top">
              <div className="page-header-content">
                <h1>My Shops</h1>
              </div>
              <button
                className="button button-primary"
                onClick={handleAddNewShop}
              >
                + Add New Shop
              </button>
            </div>
          </div>
          
          <div className="page-subtitle">
            <p>Manage your salon listings and information</p>
          </div>

          <div className="shops-grid">
            {shops.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      stroke="#0f766e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline points="9,22 9,12 15,12 15,22" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3>No shops registered yet</h3>
                <p>Register your first salon to start accepting bookings and managing your business on our platform.</p>
                <button
                  className="button button-primary"
                  onClick={handleAddNewShop}
                >
                  Register Your Salon
                </button>
              </div>
            ) : (
              shops.map((shop) => (
                <div key={shop.id} className="shop-card">
                  <div className="shop-card-header">
                    <h3>{shop.name}</h3>
                    {getStatusBadge(shop.status, shop.verification_status)}
                  </div>

                  <div className="shop-card-content">
                    <p className="shop-address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                          stroke="#6b7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="10" r="3" stroke="#6b7280" strokeWidth="2" />
                      </svg>
                      {shop.address}
                    </p>

                    <p className="shop-date">
                      Created on {new Date(shop.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="shop-card-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => handleEditShop(shop.id)}
                    >
                      Edit Shop
                    </button>

                    {shop.verification_status === 'approved' && shop.status === 'published' && (
                      <button
                        className="button button-outline"
                        onClick={() => navigate(`/salons/${shop.id}`)}
                      >
                        View Public Page
                      </button>
                    )}

                    {(shop.verification_status === 'rejected' || !shop.verification_status) && (
                      <button
                        className="button button-primary"
                        onClick={() => openVerificationModal(shop)}
                      >
                        Submit for Verification
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={verificationModal.isOpen}
        shopName={verificationModal.shopName}
        onClose={closeVerificationModal}
        onSubmit={handleSubmitForVerification}
        isLoading={submittingVerification}
      />
    </VendorPortalLayout>
  )
}

export default MyShopsPage