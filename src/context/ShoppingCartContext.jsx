import PropTypes from 'prop-types'
import { createContext, useContext, useState, useEffect } from 'react'

const ShoppingCartContext = createContext()

const CART_STORAGE_KEY = 'salonhub.shoppingCart'

export function ShoppingCartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cartItems])

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.id === product.id && item.salonId === product.salonId
      )

      if (existingItem) {
        // Update quantity if product already in cart
        return prevItems.map((item) =>
          item.id === product.id && item.salonId === product.salonId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      // Add new item
      return [
        ...prevItems,
        {
          ...product,
          quantity,
          cartItemId: `${product.id}-${Date.now()}`, // Unique cart item ID
        },
      ]
    })
  }

  // Remove item from cart
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    )
  }

  // Update quantity
  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
  }

  // Get cart totals
  const getCartTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.priceCents || 0) * item.quantity,
      0
    )
    const tax = Math.round(subtotal * 0.08) // 8% tax
    const total = subtotal + tax

    return {
      itemCount: cartItems.length,
      itemQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      total,
      subtotalDisplay: (subtotal / 100).toFixed(2),
      taxDisplay: (tax / 100).toFixed(2),
      totalDisplay: (total / 100).toFixed(2),
    }
  }

  return (
    <ShoppingCartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotals,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  )
}

ShoppingCartProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useShoppingCart() {
  const context = useContext(ShoppingCartContext)
  if (!context) {
    throw new Error('useShoppingCart must be used within ShoppingCartProvider')
  }
  return context
}
