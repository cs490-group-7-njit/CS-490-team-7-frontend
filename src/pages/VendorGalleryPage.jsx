import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyShops } from '../api/shops'
import BeforeAfterGalleryUploader from '../components/BeforeAfterGalleryUploader'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import { useAuth } from '../context/AuthContext'
import './vendor-gallery.css'

function VendorGalleryPage() {
  const { user, refreshActivity } = useAuth()
  const navigate = useNavigate()
  
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Refresh user activity
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load vendor's shops
  useEffect(() => {
    if (user?.id && user?.role === 'vendor') {
      loadShops()
    }
  }, [user])

  const loadShops = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        if (response.salons.length > 0 && !selectedShop) {
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  const handleShopChange = (shop) => {
    setSelectedShop(shop)
  }

  const handlePortfolioUpdate = () => {
    // Refresh when images are updated
    console.log('Gallery updated')
  }

  if (!user || user.role !== 'vendor') {
    return (
      <VendorPortalLayout>
        <div className="vendor-gallery-page">
          <div className="error-message">
            Access denied. Only vendors can access the gallery.
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </VendorPortalLayout>
    )
  }

  if (loading) {
    return (
      <VendorPortalLayout>
        <VendorLoadingState />
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout>
      <div className="vendor-gallery-page">
        <div className="page-header">
          <h1>📸 Service Gallery</h1>
          <p>Upload and manage your before/after transformation photos</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {shops.length === 0 ? (
          <div className="empty-state">
            <p>No shops found. Create a shop to get started.</p>
            <button onClick={() => navigate('/vendor-dashboard')} className="btn btn-primary">
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="gallery-container">
            {/* Shop Selector */}
            <div className="shop-selector">
              <label htmlFor="shop-select">Select Shop:</label>
              <select
                id="shop-select"
                value={selectedShop?.id || selectedShop?.salon_id || ''}
                onChange={(e) => {
                  const shop = shops.find(
                    (s) => (s.id || s.salon_id).toString() === e.target.value
                  )
                  if (shop) handleShopChange(shop)
                }}
              >
                {shops.map((shop) => (
                  <option key={shop.id || shop.salon_id} value={shop.id || shop.salon_id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gallery Uploader */}
            {selectedShop && (
              <div className="uploader-wrapper">
                <BeforeAfterGalleryUploader 
                  appointmentId={selectedShop.id || selectedShop.salon_id}
                  onImagesUpdated={handlePortfolioUpdate}
                  readOnly={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </VendorPortalLayout>
  )
}

export default VendorGalleryPage
