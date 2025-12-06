import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../api/http'
import Header from '../components/Header'
import { useShoppingCart } from '../context/ShoppingCartContext'
import './salons-shop.css'

const LOCAL_STORAGE_KEY_PREFIX = 'salonhub.vendorShop'

function SalonsShopPage() {
  const navigate = useNavigate()
  const { addToCart, getCartTotals } = useShoppingCart()

  const [salons, setSalons] = useState([])
  const [selectedSalonId, setSelectedSalonId] = useState(null)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [cartMessage, setCartMessage] = useState('')

  // Load all salons
  const loadSalons = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await get('/salons')
      const salonsList = response.salons || []

      setSalons(salonsList)

      // Select first salon by default
      if (salonsList.length > 0) {
        setSelectedSalonId(salonsList[0].id || salonsList[0].salon_id)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading salons:', err)
      setError(err.message || 'Failed to load salons')
      setLoading(false)
    }
  }, [])

  // Load products for selected salon
  const loadProductsForSalon = useCallback((salonId) => {
    if (!salonId) return

    try {
      const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}.${salonId}`
      const catalogJson = localStorage.getItem(storageKey)

      let salonProducts = []

      if (catalogJson) {
        try {
          const catalog = JSON.parse(catalogJson)

          // Handle array format
          if (Array.isArray(catalog)) {
            salonProducts = catalog
          }
          // Handle object format (keyed by salonId)
          else if (typeof catalog === 'object' && catalog[salonId]) {
            salonProducts = catalog[salonId]
          }
        } catch (parseError) {
          console.warn(`Failed to parse products for salon ${salonId}:`, parseError)
        }
      }

      // Filter to published products only
      const publishedProducts = salonProducts.filter(
        (p) => p.status === 'published'
      )

      setProducts(publishedProducts)
      setFilteredProducts(publishedProducts)
    } catch (err) {
      console.error('Error loading products:', err)
      setProducts([])
      setFilteredProducts([])
    }
  }, [])

  // Load salons on mount
  useEffect(() => {
    loadSalons()
  }, [loadSalons])

  // Load products when selected salon changes
  useEffect(() => {
    if (selectedSalonId) {
      loadProductsForSalon(selectedSalonId)
    }
  }, [selectedSalonId, loadProductsForSalon])

  // Get all unique tags from current salon's products
  const allTags = Array.from(
    new Set(products.flatMap((p) => p.tags || []))
  ).sort()

  // Filter and sort products
  const filterAndSort = useCallback(() => {
    let filtered = products

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.some((tag) => p.tags?.includes(tag))
      )
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price-asc':
        sorted.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0))
        break
      case 'price-desc':
        sorted.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0))
        break
      default:
        break
    }

    setFilteredProducts(sorted)
  }, [products, searchQuery, selectedTags, sortBy])

  useEffect(() => {
    filterAndSort()
  }, [filterAndSort])

  const handleAddToCart = (product) => {
    const currentSalon = salons.find(
      (s) => (s.id || s.salon_id) === selectedSalonId
    )
    addToCart({
      ...product,
      salonId: selectedSalonId,
      salonName: currentSalon?.name || 'Unknown Salon',
    })

    setCartMessage(`✓ Added "${product.name}" to cart`)
    setTimeout(() => setCartMessage(''), 3000)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSortBy('name')
  }

  const cartTotals = getCartTotals()
  const currentSalon = salons.find((s) => (s.id || s.salon_id) === selectedSalonId)

  if (loading) {
    return (
      <>
        <Header />
        <div className="page salons-shop-page">
          <div className="loading">Loading salons...</div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="page salons-shop-page">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadSalons} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page salons-shop-page">
        <Header />

        <div className="salons-shop-container">
          {/* Header */}
          <div className="page-header">
            <h1>🏪 Salon Products</h1>
            <p>Browse products from our partner salons</p>
          </div>

          {cartMessage && (
            <div className="cart-notification">
              {cartMessage}
            </div>
          )}

          {/* Salon Tabs */}
          <div className="salons-tabs-section">
            <div className="salon-tabs-container">
              <div className="salon-tabs">
                {salons.length === 0 ? (
                  <p className="no-salons">No salons available</p>
                ) : (
                  salons.map((salon) => {
                    const salonId = salon.id || salon.salon_id
                    const isActive = salonId === selectedSalonId
                    return (
                      <button
                        key={salonId}
                        onClick={() => setSelectedSalonId(salonId)}
                        className={`salon-tab ${isActive ? 'active' : ''}`}
                      >
                        <span className="salon-icon">💇</span>
                        <span className="salon-name">{salon.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Current Salon Details */}
          {currentSalon && (
            <div className="current-salon-info">
              <h2>{currentSalon.name}</h2>
              {currentSalon.address && (
                <p className="address">
                  📍{' '}
                  {typeof currentSalon.address === 'string'
                    ? currentSalon.address
                    : `${currentSalon.address.line1}${currentSalon.address.line2 ? ', ' + currentSalon.address.line2 : ''}, ${currentSalon.address.city}, ${currentSalon.address.state} ${currentSalon.address.postal_code}`}
                </p>
              )}
              {currentSalon.phone && (
                <p className="phone">📞 {currentSalon.phone}</p>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="shop-layout">
            {/* Sidebar Filters */}
            <aside className="shop-sidebar">
              <div className="filter-card">
                <h3>🔍 Search</h3>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-card">
                <h3>↕️ Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
              </div>

              {allTags.length > 0 && (
                <div className="filter-card">
                  <h3>🏷️ Categories</h3>
                  <div className="tags-list">
                    {allTags.map((tag) => (
                      <label key={tag} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag])
                            } else {
                              setSelectedTags(
                                selectedTags.filter((t) => t !== tag)
                              )
                            }
                          }}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(searchQuery || selectedTags.length > 0) && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-secondary btn-block"
                >
                  Clear Filters
                </button>
              )}

              {/* Cart Summary */}
              <div className="cart-summary">
                <h3>🛒 Cart</h3>
                <div className="cart-info">
                  <p className="cart-item-count">
                    Items: <strong>{cartTotals.itemQuantity}</strong>
                  </p>
                  <p className="cart-total">
                    Total: <strong>${cartTotals.totalDisplay}</strong>
                  </p>
                </div>
                <button
                  onClick={() => navigate('/cart')}
                  className="btn btn-primary btn-block"
                >
                  View Cart
                </button>
              </div>
            </aside>

            {/* Products Grid */}
            <main className="products-section">
              <div className="products-count">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">📦</p>
                  <h3>No products found</h3>
                  <p>
                    {products.length === 0
                      ? "This salon hasn't added any products yet."
                      : 'Try adjusting your filters or search terms.'}
                  </p>
                  {selectedTags.length > 0 || searchQuery && (
                    <button
                      onClick={handleClearFilters}
                      className="btn btn-secondary"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      {/* Image */}
                      <div className="product-image">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} />
                        ) : (
                          <div className="image-placeholder">📦</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="product-info">
                        <h4 className="product-name">{product.name}</h4>

                        {product.sku && (
                          <p className="product-sku">SKU: {product.sku}</p>
                        )}

                        {product.description && (
                          <p className="product-description">
                            {product.description.substring(0, 100)}
                            {product.description.length > 100 ? '...' : ''}
                          </p>
                        )}

                        {product.tags && product.tags.length > 0 && (
                          <div className="product-tags">
                            {product.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {product.inventory !== undefined && (
                          <p className="product-inventory">
                            Stock: {product.inventory > 0 ? product.inventory : 'Out of Stock'}
                          </p>
                        )}
                      </div>

                      {/* Price & Button */}
                      <div className="product-footer">
                        <div className="product-price">
                          <span className="price">
                            ${((product.priceCents || 0) / 100).toFixed(2)}
                          </span>
                          {product.retailPriceCents &&
                            product.retailPriceCents > product.priceCents && (
                              <span className="original-price">
                                ${((product.retailPriceCents || 0) / 100).toFixed(2)}
                              </span>
                            )}
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.inventory === 0}
                          className={`btn btn-add-to-cart ${
                            product.inventory === 0 ? 'disabled' : ''
                          }`}
                        >
                          {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default SalonsShopPage
