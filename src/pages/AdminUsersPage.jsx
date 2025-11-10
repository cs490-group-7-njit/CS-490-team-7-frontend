import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { getAllUsers, getUserSummary } from '../api/admin'
import './admin-users.css'

function AdminUsersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })

  // Filter states
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getAllUsers({
        role: selectedRole,
        status: selectedStatus,
        sortBy,
        order: sortOrder,
        limit: pagination.limit,
        offset: pagination.offset
      })
      setUsers(response.users || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await getUserSummary()
      setSummary(response.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
    fetchSummary()
  }, [selectedRole, selectedStatus, sortBy, sortOrder])

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.has_more) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
    }
  }

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
    }
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-admin'
      case 'vendor':
        return 'badge-vendor'
      case 'client':
        return 'badge-client'
      default:
        return ''
    }
  }

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'badge-active' : 'badge-inactive'
  }

  return (
    <div className="page admin-users-page">
      <Header />
      <main className="admin-container">
        <div className="admin-header">
          <h1>User Management</h1>
          <p className="subtitle">Monitor user activity and platform engagement</p>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="loading">Loading summary...</div>
        ) : summary ? (
          <section className="summary-section">
            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <p className="card-label">Total Users</p>
                <p className="card-value">{summary.total_users.toLocaleString()}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <p className="card-label">Active Users</p>
                <p className="card-value">
                  {summary.active_users.toLocaleString()}
                  <span className="card-percentage"> ({summary.active_percentage}%)</span>
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <p className="card-label">Avg Bookings/User</p>
                <p className="card-value">{summary.average_metrics.bookings_per_user}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <p className="card-label">By Role</p>
                <p className="card-breakdown">
                  Clients: {summary.by_role.client} |
                  Vendors: {summary.by_role.vendor} |
                  Admins: {summary.by_role.admin}
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <p className="card-label">Avg Reviews/User</p>
                <p className="card-value">{summary.average_metrics.reviews_per_user}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <p className="card-label">Avg Spending/User</p>
                <p className="card-value">${summary.average_metrics.spending_per_user}</p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <section className="filters-section">
          <div className="filter-group">
            <label htmlFor="role-filter">Filter by Role:</label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Activity Status:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort by:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="created_at">Join Date</option>
              <option value="name">Name</option>
              <option value="last_login">Last Login</option>
            </select>
          </div>

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </section>

        {/* Users Table */}
        <section className="users-section">
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : users.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSortChange('name')} className="sortable">
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Email</th>
                      <th>Role</th>
                      <th onClick={() => handleSortChange('created_at')} className="sortable">
                        Joined {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSortChange('last_login')} className="sortable">
                        Last Login {sortBy === 'last_login' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Bookings</th>
                      <th>Reviews</th>
                      <th>Spending</th>
                      <th>Activity Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="user-name">{user.name}</td>
                        <td className="user-email">{user.email}</td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.last_login)}</td>
                        <td className="metric-cell">{user.bookings_count}</td>
                        <td className="metric-cell">{user.reviews_count}</td>
                        <td className="metric-cell">${user.total_spending}</td>
                        <td>
                          <span className={`activity-badge ${getStatusBadgeClass(user.is_active)}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {pagination.pages}
                  ({pagination.total} total users)
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.has_more}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">No users found</div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminUsersPage
