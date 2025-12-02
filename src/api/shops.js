import { get, post, put } from './http'

// Shop/Salon management API functions using existing backend endpoints
function mergeLocalSalonData(salons = []) {
  return salons.map((salon) => {
    const storageKey = `salon_${salon.id}_data`
    const storedData = localStorage.getItem(storageKey)

    if (!storedData) {
      return salon
    }

    const parsedData = JSON.parse(storedData)
    return {
      ...salon,
      address: {
        ...salon.address,
        line1: parsedData.address?.street || salon.address?.line1,
        line2: parsedData.address?.suite || salon.address?.line2,
        city: parsedData.address?.city || salon.address?.city,
        state: parsedData.address?.state || salon.address?.state,
        postal_code: parsedData.address?.zipCode || salon.address?.postal_code,
      },
      phone: parsedData.phone || salon.phone,
    }
  })
}

export async function getMyShops(vendorId) {
  // Use the new vendor-specific endpoint that returns both published and unpublished salons
  if (!vendorId) {
    return { salons: [] }
  }

  try {
    const response = await get(`/salons/my?vendor_id=${vendorId}`)
    if (response.salons) {
      response.salons = mergeLocalSalonData(response.salons)
    }
    return response
  } catch (error) {
    console.error('Error fetching vendor salons:', error)
    // Fallback to the old method if the new endpoint isn't available
    const response = await get('/salons')
    let salons = response.salons || []

    if (vendorId) {
      salons = salons.filter((salon) => (
        salon.vendor?.id === vendorId || salon.vendor_id === vendorId
      ))
    }

    return {
      ...response,
      salons: mergeLocalSalonData(salons),
    }
  }
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
  try {
    console.log('🔍 Fetching shop details for ID:', shopId)
    const response = await get(`/salons/${shopId}`)
    
    // Check for updated data in localStorage
    const storageKey = `salon_${shopId}_data`
    const storedData = localStorage.getItem(storageKey)
    
    if (storedData && response.salon) {
      const parsedData = JSON.parse(storedData)
      console.log('💾 Found localStorage data:', parsedData)
      
      // Merge backend data with localStorage updates
      const mergedSalon = {
        ...response.salon,
        // Override with localStorage address/phone data if available
        address: {
          line1: parsedData.address?.street || response.salon.address?.line1 || '',
          line2: parsedData.address?.suite || response.salon.address?.line2 || '',
          city: parsedData.address?.city || response.salon.address?.city || '',
          state: parsedData.address?.state || response.salon.address?.state || '',
          postal_code: parsedData.address?.zipCode || response.salon.address?.postal_code || ''
        },
        phone: parsedData.phone || response.salon.phone || ''
      }
      
      console.log('🔄 Merged data:', mergedSalon)
      return { salon: mergedSalon }
    }
    
    console.log('✅ Shop details fetched:', response)
    return response
  } catch (error) {
    console.error('❌ Error fetching shop details:', error)
    return { error: 'Shop not found' }
  }
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
    // Store complete shop data in localStorage (including address/phone)
    const storageKey = `salon_${salonId}_data`
    const completeData = {
      ...shopData,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(storageKey, JSON.stringify(completeData))
    console.log('💾 Stored complete data in localStorage:', completeData)

    // Send only supported fields to backend
    const salonData = {
      name: shopData.name,
      description: shopData.description || '',
      business_type: shopData.category || 'salon'
    }

    console.log('📡 Sending supported fields to API:', salonData)
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

// UC 1.5: Submit salon for verification
export async function submitForVerification(salonId, businessTin) {
  try {
    const response = await put(`/salons/${salonId}/verify`, {
      business_tin: businessTin
    })
    return response
  } catch (error) {
    console.error('❌ Verification submission error:', error)
    throw error
  }
}

// Keep for image functionality when needed
// export async function deleteShopImage(shopId, imageId) {
//   return del(`/vendor/shops/${shopId}/images/${imageId}`)
// }