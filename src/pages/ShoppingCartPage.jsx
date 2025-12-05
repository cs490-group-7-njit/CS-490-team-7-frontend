import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useShoppingCart } from '../context/ShoppingCartContext'
import './shopping-cart.css'

function ShoppingCartPage() {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotals } = useShoppingCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState('')

  const cartTotals = getCartTotals()

  // Group items by salon for display
  const itemsBySalon = cartItems.reduce((acc, item) => {
    if (!acc[item.salonId]) {
      acc[item.salonId] = {
        salonName: item.salonName,
        items: [],
      }
    }
    acc[item.salonId].items.push(item)
    return acc
  }, {})

  const handleCheckout = () => {
    setCheckoutMessage('Order placed! Thank you for your purchase.')
    setTimeout(() => {
      clearCart()
      navigate('/dashboard')
    }, 2000)
  }

  return (
    <div className="page shopping-cart-page">
      <Header />

      <div className="cart-header">
        <h1>🛒 Shopping Cart</h1>
        <p>Review and checkout your items</p>
      </div>

      {checkoutMessage && (
        <div className="success-banner">
          {checkoutMessage}
        </div>
      )}

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p className="empty-icon">🛍️</p>
            <h2>Your cart is empty</h2>
            <p>Start shopping to add items to your cart</p>
            <button
              onClick={() => navigate('/shop')}
              className="btn btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items">
              {Object.entries(itemsBySalon).map(([salonId, { salonName, items }]) => (
                <section key={salonId} className="salon-section">
                  <h3 className="salon-name">📍 {salonName}</h3>
                  <div className="items-list">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="cart-item">
                        {/* Item Image */}
                        <div className="item-image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} />
                          ) : (
                            <div className="image-placeholder">📦</div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          {item.sku && (
                            <p className="item-sku">SKU: {item.sku}</p>
                          )}
                          {item.description && (
                            <p className="item-description">{item.description}</p>
                          )}
                        </div>

                        {/* Item Price */}
                        <div className="item-price">
                          <p className="unit-price">
                            ${((item.priceCents || 0) / 100).toFixed(2)}
                          </p>
                          <p className="item-total">
                            Total: ${(((item.priceCents || 0) * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity */}
                        <div className="item-quantity">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="qty-btn"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0
                              updateQuantity(item.cartItemId, qty)
                            }}
                            className="qty-input"
                            min="0"
                          />
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="qty-btn"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="btn-remove"
                          aria-label="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Cart Actions */}
              <div className="cart-actions">
                <button
                  onClick={() => navigate('/shop')}
                  className="btn btn-secondary"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => clearCart()}
                  className="btn btn-danger"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <aside className="cart-summary">
              <div className="summary-card">
                <h3>Order Summary</h3>

                <div className="summary-line">
                  <span>Items ({cartTotals.itemQuantity})</span>
                  <span>${cartTotals.subtotalDisplay}</span>
                </div>

                <div className="summary-line">
                  <span>Tax (8%)</span>
                  <span>${cartTotals.taxDisplay}</span>
                </div>

                <div className="summary-line total">
                  <span>Total</span>
                  <span>${cartTotals.totalDisplay}</span>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="btn btn-primary btn-block"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <>
                    <div className="checkout-form">
                      <h4>Shipping Address</h4>
                      <input
                        type="text"
                        placeholder="Street Address"
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        className="form-input"
                      />

                      <h4>Payment Method</h4>
                      <select className="form-input">
                        <option value="credit">Credit Card</option>
                        <option value="debit">Debit Card</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="btn btn-success btn-block"
                    >
                      Complete Purchase
                    </button>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="btn btn-secondary btn-block"
                    >
                      Back
                    </button>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
    </div>
  )
}

export default ShoppingCartPage
