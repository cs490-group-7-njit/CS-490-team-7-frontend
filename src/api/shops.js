import { get, post, put } from './http'

// Shop/Salon management API functions using existing backend endpoints
export async function getMyShops(vendorId) {
  // Use existing /salons endpoint and filter by vendor on frontend
  const response = await get('/salons')
  if (response.salons && vendorId) {
    // Filter salons by vendor_id since backend doesn't have vendor-specific endpoint yet
    return {
      ...response,
      salons: response.salons.filter(salon => salon.vendor?.id === vendorId)
    }
  }
  return response
}

export async function createShop(shopData) {
  // Map frontend form data to backend salon format
  const salonData = {
    name: shopData.name,
    vendor_id: shopData.vendor_id,
    address_line1: shopData.address?.street,
    address_line2: shopData.address?.suite,
    city: shopData.address?.city,
    state: shopData.address?.state,
    postal_code: shopData.address?.zipCode,
    phone: shopData.phone,
  }
  
  console.log('Sending salon data:', salonData)
  return post('/salons', salonData)
}



export async function deleteShop(shopId) {
  // Note: Backend doesn't have delete endpoint yet, return mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Shop deletion not yet implemented in backend' })
    }, 500)
  })
}

export async function getShopById(shopId) {
  // Use existing /salons endpoint and filter by ID
  const response = await get('/salons')
  if (response.salons) {
    const shop = response.salons.find(salon => salon.id === parseInt(shopId))
    return shop ? { salon: shop } : { error: 'Shop not found' }
  }
  return response
}

export async function uploadShopImages(shopId, images) {
  const formData = new FormData()
  images.forEach((image, index) => {
    formData.append(`images`, image)
  })
  
  return post(`/vendor/shops/${shopId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export async function updateShop(salonId, shopData) {
  console.log('🔄 Updating shop:', salonId, shopData)
  
  try {
    // Map frontend form data to backend salon format
    const salonData = {
      name: shopData.name,
      description: shopData.description || '',
      business_type: shopData.category || 'salon',
      address_line1: shopData.address?.street || '',
      address_line2: shopData.address?.suite || '',
      city: shopData.address?.city || '',
      state: shopData.address?.state || '',
      postal_code: shopData.address?.zipCode || '',
      phone: shopData.phone || '',
    }
    
    console.log('📡 Sending update to API:', salonData)
    const response = await put(`/salons/${salonId}`, salonData)
    
    console.log('✅ Update Response:', response)
    return response
    
  } catch (error) {
    console.error('❌ Update API Error:', error)
    
    // Fallback: Update localStorage if API fails
    const storageKey = `vendor_shops_${shopData.vendor_id}`
    const existingShops = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    const updatedShops = existingShops.map(shop => {
      if (shop.id === salonId) {
        return {
          ...shop,
          name: shopData.name,
          description: shopData.description || '',
          business_type: shopData.category || 'salon',
          address: {
            line1: shopData.address?.street || '',
            line2: shopData.address?.suite || '',
            city: shopData.address?.city || '',
            state: shopData.address?.state || '',
            postal_code: shopData.address?.zipCode || ''
          },
          phone: shopData.phone || '',
          updated_at: new Date().toISOString()
        }
      }
      return shop
    })
    
    localStorage.setItem(storageKey, JSON.stringify(updatedShops))
    
    console.log('📦 Fallback: Updated in localStorage')
    
    return {
      salon: updatedShops.find(shop => shop.id === salonId),
      message: 'Shop updated (API unavailable - saved locally)'
    }
  }
}

// Keep for image functionality when needed
// export async function deleteShopImage(shopId, imageId) {
//   return del(`/vendor/shops/${shopId}/images/${imageId}`)
// }