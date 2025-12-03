import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import '../styles/vendor-portal-layout.css'
import { useAuth } from '../context/AuthContext'
import { getMyShops } from '../api/shops'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'appointments', label: 'Appointments', path: '/vendor/appointments' },
  { key: 'shops', label: 'My Shops', path: '/shops' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'staff', label: 'Staff', path: '/staff' },
  { key: 'reviews', label: 'Reviews', path: '/vendor/reviews' },
  { key: 'revenue', label: 'Revenue', path: '/vendor/payments' },
  { key: 'marketing', label: 'Marketing', path: '/vendor/promotions' },
  { key: 'products', label: 'Products', path: '/vendor/shop' },
  { key: 'shopInfo', label: 'Shop Info', path: '/shops/new' },
]

const getActiveKeyFromPath = (pathname) => {
  const found = NAV_ITEMS.find((item) => {
    if (item.path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(item.path)
  })
  return found?.key
}

export default function VendorSidebar({ activeKey }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [shopInfoPath, setShopInfoPath] = useState('/shops/new')

  useEffect(() => {
    let canceled = false

    const resolveShopInfoPath = async () => {
      if (!user?.id || user?.role !== 'vendor') {
        if (!canceled) {
          setShopInfoPath('/shops/new')
        }
        return
      }

      try {
        const response = await getMyShops(user.id)
        const salons = response?.salons || []

        const preferredSalon = salons.find((salon) => salon.verification_status === 'approved') || salons[0]
        const salonId = preferredSalon?.id ?? preferredSalon?.salon_id

        if (!canceled) {
          if (salonId != null) {
            setShopInfoPath(`/salons/${salonId}`)
          } else {
            setShopInfoPath('/shops/new')
          }
        }
      } catch (error) {
        if (!canceled) {
          setShopInfoPath('/shops/new')
        }
      }
    }

    resolveShopInfoPath()

    return () => {
      canceled = true
    }
  }, [user?.id, user?.role])

  const resolvedActiveKey = useMemo(() => {
    if (activeKey) {
      return activeKey
    }
    return getActiveKeyFromPath(location.pathname)
  }, [activeKey, location.pathname])

  const items = useMemo(() => {
    const updatedItems = NAV_ITEMS.map((item) => (
      item.key === 'shopInfo'
        ? { ...item, path: shopInfoPath }
        : item
    ))

    if (!resolvedActiveKey) {
      return updatedItems
    }

    return updatedItems.filter((item) => item.key !== resolvedActiveKey)
  }, [resolvedActiveKey, shopInfoPath])

  return (
    <aside className="vendor-sidebar">
      <nav aria-label="Vendor navigation">
        <ul className="vendor-sidebar-list">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className="vendor-sidebar-item"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

VendorSidebar.propTypes = {
  activeKey: PropTypes.string,
}
