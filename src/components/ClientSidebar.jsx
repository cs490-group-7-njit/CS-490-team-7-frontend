import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'

const CLIENT_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'bookings', label: 'My Bookings', path: '/appointments/history' },
  { key: 'messages', label: 'Messages', path: '/messages' },
  { key: 'notifications', label: 'Notifications', path: '/notifications' },
  { key: 'favorites', label: 'Favorite Salons', path: '/favorites' },
  { key: 'rewards', label: 'Rewards', path: '/loyalty-points' },
  { key: 'profile', label: 'Profile', path: '/profile/edit' },
]

function resolveActiveKey(explicitKey, pathname) {
  if (explicitKey) {
    return explicitKey
  }

  const matchedItem = CLIENT_NAV_ITEMS.find((item) => {
    if (pathname === item.path) {
      return true
    }

    const normalizedPath = item.path.endsWith('/') ? item.path : `${item.path}/`
    return pathname.startsWith(normalizedPath)
  })

  return matchedItem ? matchedItem.key : 'dashboard'
}

export default function ClientSidebar({ activeKey }) {
  const navigate = useNavigate()
  const location = useLocation()
  const resolvedActiveKey = resolveActiveKey(activeKey, location.pathname)

  return (
    <aside className="dashboard-sidebar">
      <nav aria-label="Client dashboard navigation">
        {CLIENT_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-item${item.key === resolvedActiveKey ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

ClientSidebar.propTypes = {
  activeKey: PropTypes.string,
}
