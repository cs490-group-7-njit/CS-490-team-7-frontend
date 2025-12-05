import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../api/notifications'
import ClientPortalLayout from '../components/ClientPortalLayout'
import { useAuth } from '../context/AuthContext'
import './notifications.css'

function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications(user.user_id, {
        unreadOnly: filter === 'unread',
        page: 1,
        limit: 50,
      })
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.user_id)
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_confirmed':
        return '✅'
      case 'appointment_completed':
        return '🎉'
      case 'appointment_cancelled':
        return '❌'
      case 'appointment_rescheduled':
        return '📅'
      case 'loyalty_points_earned':
        return '⭐'
      case 'message_received':
        return '💬'
      case 'discount_alert':
        return '💰'
      default:
        return '📢'
    }
  }

  if (loading) {
    return (
      <ClientPortalLayout
        activeKey="notifications"
        pageClassName="notifications-page"
        contentClassName="page-content"
      >
        <h1>Notifications</h1>
        <div className="loading">Loading notifications...</div>
      </ClientPortalLayout>
    )
  }

  if (error) {
    return (
      <ClientPortalLayout
        activeKey="notifications"
        pageClassName="notifications-page"
        contentClassName="page-content"
      >
        <h1>Notifications</h1>
        <div className="error">Error: {error}</div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout
      activeKey="notifications"
      pageClassName="notifications-page"
      contentClassName="page-content"
    >
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-controls">
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-read-btn"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
          <Link to="/discount-alerts" className="view-alerts-link">
            View discount alerts →
          </Link>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications found.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div className="notification-content">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-date">
                  {formatDate(notification.created_at)}
                </span>
              </div>
              {!notification.is_read && (
                <button
                  type="button"
                  className="mark-read-btn"
                  onClick={() => markAsRead(notification.notification_id)}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </ClientPortalLayout>
  )
}

export default NotificationsPage
