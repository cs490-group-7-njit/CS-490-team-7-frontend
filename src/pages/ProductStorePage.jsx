import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { getSalonProducts, purchaseProduct } from '../api/products'
import { searchSalons } from '../api/salons'
import './product-store.css'

function ProductStorePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [salons, setSalons] = useState([])
  const [salonLoading, setSalonLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedSalonId, setSelectedSalonId] = useState('')
  const [quantityByProduct, setQuantityByProduct] = useState({})
  const [statusMessage, setStatusMessage] = useState(null)
  const [error, setError] = useState(null)
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadSalons = async () => {
      try {
        setSalonLoading(true)
        const response = await searchSalons({ limit: 50 })
        setSalons(response.salons || [])
        if ((response.salons || []).length > 0) {
          setSelectedSalonId(response.salons[0].id)
        }
      } catch (err) {
        console.error('Failed to load salons', err)
        setError('Unable to load salons right now.')
      } finally {
        setSalonLoading(false)
      }
    }

    loadSalons()
  }, [user, navigate])

  useEffect(() => {
    if (!selectedSalonId) {
      setProducts([])
      return
    }

    const loadProducts = async () => {
      try {
        setProductsLoading(true)
        setError(null)
        const response = await getSalonProducts(selectedSalonId, { limit: 20 })
        setProducts(response.products || [])
      } catch (err) {
        console.error('Failed to load products', err)
        setError('Unable to load products for this salon.')
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [selectedSalonId])

  const handleQuantityChange = (productId, value) => {
    setQuantityByProduct((prev) => ({
      ...prev,
      [productId]: value,
    }))
  }

  const handlePurchase = async (productId) => {
    const quantity = Number(quantityByProduct[productId] || 1)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setStatusMessage(null)
      setError('Quantity must be a whole number greater than zero.')
      return
    }

    try {
      setError(null)
      setStatusMessage(null)
      setPurchaseSubmitting(productId)
      await purchaseProduct(user.id, productId, quantity)
      setStatusMessage('Purchase placed successfully! You will receive confirmation shortly.')
      setQuantityByProduct((prev) => ({ ...prev, [productId]: 1 }))
    } catch (err) {
      console.error('Failed to purchase product', err)
      setError(err.message || 'Unable to complete purchase right now.')
    } finally {
      setPurchaseSubmitting(null)
    }
  }

  const formattedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      price_dollars: Number(product.price_cents / 100).toFixed(2),
      available: product.stock_quantity > 0,
    }))
  }, [products])

  if (!user) {
    return null
  }

  return (
    <div className="page product-store-page">
      <Header />
      <main className="product-store-container">
        <div className="store-hero">
          <div>
            <p className="eyebrow">UC 2.15 &middot; Product Marketplace</p>
            <h1>Pick up salon products online</h1>
            <p>
              Browse in-stock retail items from your favorite salons and reserve them ahead of your
              next appointment.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/appointments')}
          >
            Schedule appointment
          </button>
        </div>

        {statusMessage && (
          <div className="store-alert success">
            <p>{statusMessage}</p>
            <button type="button" onClick={() => setStatusMessage(null)}>
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="store-alert error">
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        <section className="salon-picker">
          <label htmlFor="salon-select">Choose a salon</label>
          <div className="salon-select-wrapper">
            {salonLoading ? (
              <p>Loading salons…</p>
            ) : salons.length === 0 ? (
              <p>No salons available yet.</p>
            ) : (
              <select
                id="salon-select"
                value={selectedSalonId}
                onChange={(event) => setSelectedSalonId(event.target.value)}
              >
                {salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name} &middot; {salon.city || 'Unknown city'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        <section className="products-section">
          <div className="section-header">
            <h2>Available products</h2>
            <p>
              {productsLoading
                ? 'Fetching catalog…'
                : `${formattedProducts.length} item${formattedProducts.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {productsLoading ? (
            <div className="products-loading">
              <div className="spinner" aria-hidden="true" />
              <p>Loading products…</p>
            </div>
          ) : formattedProducts.length === 0 ? (
            <div className="empty-products">
              <p>No products are published for this salon yet.</p>
            </div>
          ) : (
            <div className="products-grid">
              {formattedProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-headline">
                    <h3>{product.name}</h3>
                    <span>${product.price_dollars}</span>
                  </div>
                  {product.description && <p className="product-description">{product.description}</p>}
                  <ul className="product-meta">
                    <li>Category: {product.category || 'General'}</li>
                    <li>
                      Stock:{' '}
                      {product.stock_quantity > 0
                        ? `${product.stock_quantity} in stock`
                        : 'Out of stock'}
                    </li>
                  </ul>
                  <div className="purchase-controls">
                    <label htmlFor={`qty-${product.id}`}>Qty</label>
                    <input
                      id={`qty-${product.id}`}
                      type="number"
                      min="1"
                      value={quantityByProduct[product.id] ?? 1}
                      onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                    />
                    <button
                      type="button"
                      className="purchase-button"
                      disabled={!product.available || purchaseSubmitting === product.id}
                      onClick={() => handlePurchase(product.id)}
                    >
                      {purchaseSubmitting === product.id ? 'Processing…' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default ProductStorePage
