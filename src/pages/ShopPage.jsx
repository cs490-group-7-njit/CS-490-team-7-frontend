import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyShops } from '../api/shops'
import { searchSalons } from '../api/salons'
import Header from '../components/Header'
import { useShoppingCart } from '../context/ShoppingCartContext'
import { useAuth } from '../context/AuthContext'
import './shop.css'

const LOCAL_STORAGE_KEY_PREFIX = 'salonhub.vendorShop'

function ShopPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, getCartTotals } = useShoppingCart()
  
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [cartMessage, setCartMessage] = useState('')

  // Load products from all vendors
  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all salons (this is a public endpoint)
      const salonsResponse = await searchSalons({ limit: 100 })
      const allSalons = salonsResponse.salons || []
      console.log('📍 Fetched salons:', allSalons.length, allSalons.map(s => ({ id: s.id || s.salon_id, name: s.name })))

      // Load products from localStorage for each salon
      const allProducts = []
      
      for (const salon of allSalons) {
        const salonId = salon.id || salon.salon_id
        const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}.${salonId}`
        
        try {
          const catalogJson = localStorage.getItem(storageKey)
          if (catalogJson) {
            const catalog = JSON.parse(catalogJson)
            console.log(`📦 Found products for salon ${salonId}:`, catalog)
            
            // Array format
            if (Array.isArray(catalog)) {
              catalog.forEach((product) => {
                allProducts.push({
                  ...product,
                  salonId,
                  salonName: salon.name,
                })
              })
            }
            // Object format (keyed by salonId)
            else if (typeof catalog === 'object' && catalog[salonId]) {
              catalog[salonId].forEach((product) => {
                allProducts.push({
                  ...product,
                  salonId,
                  salonName: salon.name,
                })
              })
            }
          }
        } catch (parseError) {
          console.warn(`Failed to parse products for salon ${salonId}:`, parseError)
        }
      }

      console.log('✅ Total products found:', allProducts.length)
      console.log('📊 Products by status:', allProducts.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {}))

      // Filter to published products only
      const publishedProducts = allProducts.filter(
        (p) => p.status === 'published'
      )

      console.log('🎉 Published products:', publishedProducts.length)
      setProducts(publishedProducts)
      setFilteredProducts(publishedProducts)
    } catch (err) {
      console.error('Error loading products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load products on mount
  useEffect(() => {
    loadAllProducts()
  }, [loadAllProducts])

  // Filter and sort products
  useMemo(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.salonName?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.some((tag) => (p.tags || []).includes(tag))
      )
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedTags, sortBy, products])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set()
    products.forEach((p) => {
      (p.tags || []).forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [products])

  const handleAddToCart = (product) => {
    addToCart(product, 1)
    setCartMessage(`✓ Added "${product.name}" to cart!`)
    setTimeout(() => setCartMessage(''), 3000)
  }

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const cartTotals = getCartTotals()

  if (loading) {
    return (
      <div className="page shop-page">
        <Header />
        <div className="shop-layout">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page shop-page">
      <Header />

      <div className="shop-header">
        <h1>🛍️ Product Shop</h1>
        <p>Browse and purchase products from our vendor partners</p>
      </div>

      <div className="shop-layout">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadAllProducts} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {cartMessage && (
          <div className="success-banner">
            {cartMessage}
          </div>
        )}

        <div className="shop-layout">
          {/* Sidebar - Filters */}
          <aside className="shop-sidebar">
            {/* Search */}
            <div className="filter-section">
              <h3>Search</h3>
              <input
                type="text"
                placeholder="Search products, salons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Sort */}
            <div className="filter-section">
              <h3>Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
              </select>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="filter-section">
                <h3>Categories</h3>
                <div className="tag-list">
                  {allTags.map((tag) => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleToggleTag(tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Summary */}
            <div className="filter-section cart-summary">
              <h3>🛒 Cart</h3>
              <div className="cart-totals">
                <p className="cart-item-count">
                  Items: <strong>{cartTotals.itemQuantity}</strong>
                </p>
                <p className="cart-total">
                  Total: <strong>${cartTotals.totalDisplay}</strong>
                </p>
                <button
                  onClick={() => navigate('/cart')}
                  className="btn btn-primary btn-block"
                  disabled={cartTotals.itemQuantity === 0}
                >
                  View Cart
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content - Products Grid */}
          <main className="shop-main">
            <div className="products-header">
              <p className="product-count">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedTags.length > 0 && ` in ${selectedTags.join(', ')}`}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>😕 No products found</p>
                <p className="empty-subtitle">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedTags([])
                  }}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={`${product.salonId}-${product.id}`} className="product-card">
                    {/* Product Image */}
                    <div className="product-image-container">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="product-image"
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                      <p className="product-salon">{product.salonName}</p>
                      <h3 className="product-name">{product.name}</h3>

                      {product.description && (
                        <p className="product-description">{product.description}</p>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <div className="product-tags">
                          {product.tags.map((tag) => (
                            <span key={tag} className="product-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="product-footer">
                        <div className="product-price">
                          <span className="price">
                            ${((product.priceCents || 0) / 100).toFixed(2)}
                          </span>
                          {product.retailPriceCents && product.retailPriceCents > product.priceCents && (
                            <span className="original-price">
                              ${((product.retailPriceCents || 0) / 100).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className="btn btn-primary btn-add-cart"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default ShopPage
