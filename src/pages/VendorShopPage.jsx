import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMyShops } from '../api/shops'
import VendorPortalLayout from '../components/VendorPortalLayout'
import { useAuth } from '../context/AuthContext'
import hydratingShampooImage from '../assets/Shampoo.png'
import repairMaskImage from '../assets/Mask.png'
import './vendor-shop.css'

const LOCAL_STORAGE_KEY_PREFIX = 'salonhub.vendorShop'
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const defaultCatalog = [
  {
    id: 'demo-1',
    name: 'Hydrating Shampoo',
    sku: 'SHMP-001',
    priceCents: 1800,
    retailPriceCents: 2500,
    inventory: 18,
    status: 'draft',
    description: 'Moisturizing daily shampoo infused with argan and jojoba oils.',
    tags: ['Hair Care', 'Best Seller'],
    imageUrl: hydratingShampooImage,
    imageFileName: 'Shampoo.png',
  },
  {
    id: 'demo-2',
    name: 'Repair Mask',
    sku: 'MASK-214',
    priceCents: 3200,
    retailPriceCents: 4200,
    inventory: 12,
    status: 'published',
    description: 'Deep conditioning mask that restores strength and shine in one treatment.',
    tags: ['Hair Care'],
    imageUrl: repairMaskImage,
    imageFileName: 'Mask.png',
  },
]

const SEED_IMAGE_UPDATES = [
  {
    prefix: 'demo-1',
    newUrl: hydratingShampooImage,
    newFileName: 'Shampoo.png',
    legacyUrls: [
      'https://images.pexels.com/photos/3735612/pexels-photo-3735612.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://lh3.googleusercontent.com/gg-dl/ABS2GSmVMMekCnocAxS-Ed07OI9cegYRHnO0mvOiuHPBUQ1SJzquanKiU-qZV2Rhdzi3giQlrVfVKNLr6_4PhSWeAp11yiXTDTy2iELc0usqML25YNKIRRHfUCp-ciIkVDfJy7TOknP6ybBKc84cz84KiAnWQKkZ92uS54zD7bPED7DGxc2_FQ=s1024-rj',
      '/home/shark/GP/CS-490-team-7-frontend/src/assets/Shampoo.png',
      'Shampoo.png',
    ],
  },
  {
    prefix: 'demo-2',
    newUrl: repairMaskImage,
    newFileName: 'Mask.png',
    legacyUrls: [
      'https://images.pexels.com/photos/3735616/pexels-photo-3735616.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://lh3.googleusercontent.com/gg-dl/ABS2GSmYT35oLuhVsJA1UdvDuVIvQdS2SO4ixbgitFLR6Zr2KG1rhMzwtx0RhaTOJdRG6aFWNdd8_UbxwINFoUpXIqx2vmeCJG9OYE6EwAPs5C8i998qI9aehV70okpXyHvM8COiFSQLoFFtuVeIdQTIC_Y6XyUZrhiudHMtcQjp373YkAzz=s1024-rj',
      '/home/shark/GP/CS-490-team-7-frontend/src/assets/RepairMask.png',
      '/home/shark/GP/CS-490-team-7-frontend/src/assets/Mask.png',
      'RepairMask.png',
      'Mask.png',
    ],
  },
]

const upgradeDefaultProductImages = (catalog) => {
  let changed = false

  const upgraded = Object.fromEntries(
    Object.entries(catalog).map(([salonId, products]) => {
      if (!Array.isArray(products) || products.length === 0) {
        return [salonId, products]
      }

      const nextProducts = products.map((product) => {
        const updateRule = SEED_IMAGE_UPDATES.find((rule) => product.id?.startsWith(rule.prefix))
        if (!updateRule) {
          return product
        }

        const hasLegacyImage = !product.imageUrl || updateRule.legacyUrls.some((legacy) => {
          if (!legacy || typeof product.imageUrl !== 'string') {
            return false
          }

          if (legacy.startsWith('http') || legacy.startsWith('/home/')) {
            return product.imageUrl === legacy
          }

          return product.imageUrl.endsWith(legacy)
        })
        let nextProduct = product

        if (hasLegacyImage && product.imageUrl !== updateRule.newUrl) {
          changed = true
          nextProduct = {
            ...nextProduct,
            imageUrl: updateRule.newUrl,
          }
        }

        if (!nextProduct.imageFileName && updateRule.newFileName) {
          changed = true
          nextProduct = {
            ...nextProduct,
            imageFileName: updateRule.newFileName,
          }
        }

        return nextProduct
      })

      return [salonId, nextProducts]
    })
  )

  return changed ? upgraded : catalog
}

const emptyProduct = {
  id: '',
  name: '',
  sku: '',
  priceCents: '',
  retailPriceCents: '',
  inventory: '',
  status: 'draft',
  description: '',
  tags: '',
  imageUrl: '',
  imageFileName: '',
}

function formatCurrency(cents) {
  if (Number.isNaN(Number(cents))) {
    return '$0.00'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(cents) / 100)
}

function toCents(value) {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return 0
  }
  return Math.round(number * 100)
}

function useLocalCatalog(vendorId) {
  const storageKey = useMemo(() => {
    if (!vendorId) {
      return null
    }
    return `${LOCAL_STORAGE_KEY_PREFIX}.${vendorId}`
  }, [vendorId])

  const [catalogBySalon, setCatalogBySalon] = useState({})

  useEffect(() => {
    if (!storageKey) {
      setCatalogBySalon({})
      return
    }
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) {
        setCatalogBySalon({})
        return
      }
      const parsed = JSON.parse(stored)
      if (!parsed || typeof parsed !== 'object') {
        setCatalogBySalon({})
        return
      }

      const normalized = parsed.salons && typeof parsed.salons === 'object' ? parsed.salons : parsed
      const safeCatalog = normalized && typeof normalized === 'object' ? normalized : {}
      const upgraded = upgradeDefaultProductImages(safeCatalog)
      setCatalogBySalon(upgraded)
    } catch (error) {
      console.warn('Failed to parse stored vendor catalog', error)
      setCatalogBySalon({})
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) {
      return
    }
    localStorage.setItem(storageKey, JSON.stringify(catalogBySalon))
  }, [catalogBySalon, storageKey])

  const upsertProduct = useCallback((salonId, product) => {
    setCatalogBySalon((prev) => {
      const next = { ...prev }
      const list = Array.isArray(next[salonId]) ? [...next[salonId]] : []
      const index = list.findIndex((item) => item.id === product.id)
      if (index === -1) {
        list.unshift(product)
      } else {
        list[index] = product
      }
      next[salonId] = list
      return next
    })
  }, [])

  const deleteProduct = useCallback((salonId, productId) => {
    setCatalogBySalon((prev) => {
      const next = { ...prev }
      const list = Array.isArray(next[salonId]) ? next[salonId].filter((item) => item.id !== productId) : []
      next[salonId] = list
      return next
    })
  }, [])

  const seedDefaultIfEmpty = useCallback((salonId) => {
    setCatalogBySalon((prev) => {
      if (prev[salonId]?.length) {
        return prev
      }
      return {
        ...prev,
        [salonId]: defaultCatalog.map((item) => ({ ...item, id: `${item.id}-${generateId()}` })),
      }
    })
  }, [])

  return {
    catalogBySalon,
    upsertProduct,
    deleteProduct,
    seedDefaultIfEmpty,
  }
}

export default function VendorShopPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [selectedSalonId, setSelectedSalonId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draftProduct, setDraftProduct] = useState(emptyProduct)
  const [showForm, setShowForm] = useState(false)

  const { catalogBySalon, upsertProduct, deleteProduct, seedDefaultIfEmpty } = useLocalCatalog(user?.id)

  useEffect(() => {
    const loadShops = async () => {
      if (!user?.id) {
        return
      }
      try {
        setLoading(true)
        const response = await getMyShops(user.id)
        const payload = response?.salons || []
        setShops(payload)
        if (payload.length > 0) {
          const firstId = String(payload[0].id ?? payload[0].salon_id)
          setSelectedSalonId(firstId)
          seedDefaultIfEmpty(firstId)
        }
      } catch (err) {
        console.error('Failed to load shops', err)
        setError('Unable to load your shops right now.')
      } finally {
        setLoading(false)
      }
    }

    loadShops()
  }, [seedDefaultIfEmpty, user?.id])

  useEffect(() => {
    if (!selectedSalonId) {
      return
    }
    seedDefaultIfEmpty(selectedSalonId)
  }, [selectedSalonId, seedDefaultIfEmpty])

  const products = useMemo(() => {
    if (!selectedSalonId) {
      return []
    }
    return catalogBySalon[selectedSalonId] || []
  }, [catalogBySalon, selectedSalonId])

  const selectedSalonName = useMemo(() => {
    if (!selectedSalonId) {
      return ''
    }
    const record = shops.find((salon) => String(salon.id ?? salon.salon_id) === selectedSalonId)
    return record?.name || record?.salon_name || 'Shop'
  }, [selectedSalonId, shops])

  const handleDraftChange = (field, value) => {
    if (field === 'imageUrl') {
      setDraftProduct((prev) => ({
        ...prev,
        imageUrl: value,
        imageFileName: '',
      }))
      return
    }

    setDraftProduct((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDraftImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('Please choose an image that is 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('We could not read that image file.')
        return
      }

      setDraftProduct((prev) => ({
        ...prev,
        imageUrl: reader.result,
        imageFileName: file.name,
      }))
      setError('')
    }

    reader.onerror = () => {
      console.error('Failed to read image file', reader.error)
      setError('We could not read that image file.')
    }

    // Persist the image as a data URL so it can survive page reloads.
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const clearDraftImage = () => {
    setDraftProduct((prev) => ({
      ...prev,
      imageUrl: '',
      imageFileName: '',
    }))
    setError('')
  }

  const resetDraft = () => {
    setDraftProduct(emptyProduct)
    setShowForm(false)
  }

  const handleCreateProduct = (event) => {
    event.preventDefault()
    if (!selectedSalonId) {
      setError('Select a shop before adding products.')
      return
    }

    if (!draftProduct.name.trim()) {
      setError('Product name is required.')
      return
    }

    const newProduct = {
      id: `local-${generateId()}`,
      name: draftProduct.name.trim(),
      sku: draftProduct.sku.trim() || `SKU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      priceCents: toCents(draftProduct.priceCents || 0),
      retailPriceCents: toCents(draftProduct.retailPriceCents || draftProduct.priceCents || 0),
      inventory: Number(draftProduct.inventory) || 0,
      status: draftProduct.status,
      description: draftProduct.description.trim(),
      tags: draftProduct.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: draftProduct.imageUrl.trim(),
      imageFileName: draftProduct.imageFileName,
      createdAt: new Date().toISOString(),
    }

    upsertProduct(selectedSalonId, newProduct)
    resetDraft()
    setError('')
  }

  const handleDeleteProduct = (productId) => {
    if (!selectedSalonId) {
      return
    }
    if (!window.confirm('Remove this product from your online catalog?')) {
      return
    }
    deleteProduct(selectedSalonId, productId)
  }

  const handleStatusToggle = (product) => {
    if (!selectedSalonId) {
      return
    }
    const updated = { ...product, status: product.status === 'published' ? 'draft' : 'published' }
    upsertProduct(selectedSalonId, updated)
  }

  if (loading && shops.length === 0) {
    return (
      <VendorPortalLayout activeKey="products">
        <div className="vendor-shop-page">
          <div className="vendor-shop-empty">Loading your shops...</div>
        </div>
      </VendorPortalLayout>
    )
  }

  if (error && shops.length === 0) {
    return (
      <VendorPortalLayout activeKey="products">
        <div className="vendor-shop-page">
          <div className="vendor-shop-empty">{error}</div>
        </div>
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="products">
      <div className="vendor-shop-page">
      <header className="vendor-shop-header">
        <div>
          <h1>Online Shop</h1>
          <p className="vendor-shop-subtitle">
            Build your storefront, track inventory, and get ready to sell directly to clients.
          </p>
        </div>
        <button
          type="button"
          className="vendor-shop-primary"
          onClick={() => setShowForm((prev) => !prev)}
          disabled={!selectedSalonId}
        >
          {showForm ? 'Close Product Form' : 'Add Product'}
        </button>
      </header>

      <section className="vendor-shop-controls">
        <div className="control-group">
          <label htmlFor="shop-select">Select Shop</label>
          <select
            id="shop-select"
            value={selectedSalonId}
            onChange={(event) => setSelectedSalonId(event.target.value)}
          >
            <option value="">Choose your shop</option>
            {shops.map((salon) => {
              const id = String(salon.id ?? salon.salon_id)
              const name = salon.name || salon.salon_name
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              )
            })}
          </select>
        </div>
        <div className="control-summary">
          <span className="summary-title">Catalog Snapshot</span>
          <ul>
            <li>
              <strong>{products.length}</strong>
              <span>Products</span>
            </li>
            <li>
              <strong>
                {formatCurrency(
                  products.reduce((sum, item) => sum + Number(item.priceCents || 0) * Number(item.inventory || 0), 0),
                )}
              </strong>
              <span>Total Inventory Value</span>
            </li>
            <li>
              <strong>{products.filter((item) => item.status === 'published').length}</strong>
              <span>Live Listings</span>
            </li>
          </ul>
        </div>
      </section>

      {showForm && (
        <section className="vendor-shop-form">
          <h2>Create Product</h2>
          <form onSubmit={handleCreateProduct}>
            <div className="form-grid">
              <label>
                Product Name
                <input
                  type="text"
                  value={draftProduct.name}
                  onChange={(event) => handleDraftChange('name', event.target.value)}
                  placeholder="Hydrating Shampoo"
                  required
                />
              </label>
              <label>
                SKU
                <input
                  type="text"
                  value={draftProduct.sku}
                  onChange={(event) => handleDraftChange('sku', event.target.value)}
                  placeholder="SKU-12345"
                />
              </label>
              <label>
                Cost (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftProduct.priceCents}
                  onChange={(event) => handleDraftChange('priceCents', event.target.value)}
                  placeholder="18.00"
                />
              </label>
              <label>
                Retail Price (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftProduct.retailPriceCents}
                  onChange={(event) => handleDraftChange('retailPriceCents', event.target.value)}
                  placeholder="25.00"
                />
              </label>
              <label>
                Inventory Count
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draftProduct.inventory}
                  onChange={(event) => handleDraftChange('inventory', event.target.value)}
                  placeholder="10"
                />
              </label>
              <label>
                Status
                <select
                  value={draftProduct.status}
                  onChange={(event) => handleDraftChange('status', event.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <label className="form-full">
              Description
              <textarea
                rows={3}
                value={draftProduct.description}
                onChange={(event) => handleDraftChange('description', event.target.value)}
                placeholder="Briefly describe the benefits and usage."
              />
            </label>
            <label className="form-full">
              Tags (comma separated)
              <input
                type="text"
                value={draftProduct.tags}
                onChange={(event) => handleDraftChange('tags', event.target.value)}
                placeholder="Hair Care, Vegan"
              />
            </label>
            <label className="form-full">
              Product Image
              <div className="vendor-shop-image-upload">
                {draftProduct.imageUrl && (
                  <div className="vendor-shop-image-preview">
                    <img src={draftProduct.imageUrl} alt={draftProduct.name || 'Uploaded preview'} />
                    <div className="vendor-shop-image-preview-details">
                      <span>{draftProduct.imageFileName || 'Image from URL'}</span>
                      <button type="button" className="vendor-shop-image-remove" onClick={clearDraftImage}>
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleDraftImageUpload} />
                <span className="vendor-shop-image-helper">Upload a JPG or PNG up to 5 MB.</span>
              </div>
            </label>
            <label className="form-full">
              Image URL (optional)
              <input
                type="text"
                value={draftProduct.imageFileName ? '' : draftProduct.imageUrl}
                onChange={(event) => handleDraftChange('imageUrl', event.target.value)}
                placeholder="https://..."
              />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={resetDraft}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={!selectedSalonId}>
                Save to Catalog
              </button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="vendor-shop-error">{error}</div>}

  <section className="vendor-shop-grid">
        <header className="grid-header">
          <h2>{selectedSalonName} Catalog</h2>
          <p>Preview how your products will appear to clients once the storefront is connected.</p>
        </header>
        {products.length === 0 ? (
          <div className="vendor-shop-empty">
            No products yet. Add your first product to start building your storefront.
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">No Image</div>
                  )}
                  <span className={`product-status product-status-${product.status}`}>
                    {product.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="product-content">
                  <header>
                    <h3>{product.name}</h3>
                    <p className="product-sku">{product.sku}</p>
                  </header>
                  <p className="product-description">{product.description || 'No description yet.'}</p>
                  {product.tags?.length > 0 && (
                    <ul className="product-tags">
                      {product.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  )}
                  <div className="product-meta">
                    <div>
                      <span className="label">Retail</span>
                      <strong>{formatCurrency(product.retailPriceCents || product.priceCents)}</strong>
                    </div>
                    <div>
                      <span className="label">Inventory</span>
                      <strong className={product.inventory <= 5 ? 'inventory-low' : ''}>{product.inventory}</strong>
                    </div>
                  </div>
                </div>
                <footer className="product-actions">
                  <button type="button" onClick={() => handleStatusToggle(product)}>
                    {product.status === 'published' ? 'Move to Draft' : 'Publish'}
                  </button>
                  <button type="button" className="danger" onClick={() => handleDeleteProduct(product.id)}>
                    Remove
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Waiting for the following features to be implemented */}
      <section className="vendor-shop-roadmap">
        <h2>Up Next</h2>
        <ul>
          <li>Connect inventory to the backend to sync across devices.</li>
          <li>Enable client storefront at beautiful-hair.com/salons/{selectedSalonId}/shop.</li>
          <li>Offer checkout with saved payment methods and appointment upsells.</li>
        </ul>
      </section>
      </div>
    </VendorPortalLayout>
  )
}
