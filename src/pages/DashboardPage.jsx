import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyShops } from '../api/shops'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './dashboard.css'

// Vendor Dashboard Data
const demoSchedule = [
  {
    stylist: 'Sarah',
    rows: [
      { time: '9:00 AM', client: 'Anya S', service: 'Haircut & Style' },
    ],
  },
  {
    stylist: 'Mark',
    rows: [
      { time: '10:00 AM', client: 'Dylan P', service: 'Haircut & Trim' },
      { time: '12:30 PM', client: 'Alex A', service: 'Haircut & Trim' },
    ],
  },
]

const demoStats = {
  bookings: { value: 178, delta: '+12%' },
  revenue: { value: '$7,120', delta: '+30%' },
  totalSales: '$187,118',
}

// Client Dashboard Data
const clientData = {
  rewardPoints: 2450,
  nearbyShops: [
    { name: 'Beauty Paradise', distance: '0.3 miles', rating: 4.8, nextAvailable: 'Today 2:00 PM' },
    { name: 'Style Studio', distance: '0.5 miles', rating: 4.6, nextAvailable: 'Tomorrow 10:00 AM' },
    { name: 'Glamour Lounge', distance: '0.7 miles', rating: 4.9, nextAvailable: 'Today 4:30 PM' }
  ],
  popularShops: [
    { name: 'Trendy Cuts', bookings: 1250, rating: 4.9 },
    { name: 'Elite Salon', bookings: 980, rating: 4.8 },
    { name: 'Beauty Hub', bookings: 875, rating: 4.7 }
  ],
  recentVisits: [
    { salon: 'Beauty Paradise', service: 'Haircut & Color', date: '2024-10-20', rating: 5 },
    { salon: 'Style Studio', service: 'Manicure', date: '2024-10-15', rating: 4 },
    { salon: 'Glamour Lounge', service: 'Facial Treatment', date: '2024-10-10', rating: 5 }
  ]
}

// Admin Dashboard Data
const adminData = {
  platformStats: {
    totalUsers: 12450,
    activeSalons: 287,
    pendingVerifications: 15,
    systemUptime: '99.8%'
  },
  revenueMetrics: {
    totalRevenue: '$2,450,000',
    monthlyGrowth: '+18%',
    avgSalonRevenue: '$8,535'
  },
  appointmentTrends: {
    todayAppointments: 1247,
    weeklyGrowth: '+12%',
    peakHours: '2:00 PM - 4:00 PM'
  },
  loyaltyProgram: {
    activeMembers: 8970,
    pointsRedeemed: '1.2M',
    programUsage: '67%'
  },
  pendingActions: [
    { type: 'verification', salon: 'New Beauty Spa', priority: 'high' },
    { type: 'verification', salon: 'Luxury Nails', priority: 'medium' },
    { type: 'report', item: 'Monthly Performance Report', priority: 'low' }
  ]
}

function DashboardPage() {
  const { user, refreshActivity } = useAuth()
  const navigate = useNavigate()
  const [vendorShops, setVendorShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)

  // Refresh user activity when dashboard is accessed
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Fetch vendor shops if user is a vendor
  useEffect(() => {
    if (user?.role === 'vendor') {
      fetchVendorShops()
    }
  }, [user])

  const fetchVendorShops = async () => {
    try {
      setShopsLoading(true)
      const response = await getMyShops(user.id)

      if (response.salons && !response.error) {
        const transformedShops = response.salons.map(salon => ({
          id: salon.id,
          name: salon.name,
          status: salon.is_published ? 'published' : 'draft',
          verification_status: salon.verification_status,
          created_at: salon.created_at
        }))
        setVendorShops(transformedShops)
      }
    } catch (error) {
      console.error('Error fetching vendor shops:', error)
    } finally {
      setShopsLoading(false)
    }
  }

  const userRole = user?.role || 'client'

  const greeting = useMemo(() => {
    const name = user?.name || (userRole === 'admin' ? 'Admin' : userRole === 'client' ? 'Client' : 'Vendor')
    const firstName = name.split(' ')[0]
    return `Welcome to your Dashboard, ${firstName}`
  }, [user, userRole])

  const handleNavigation = (item) => {
    switch (item) {
      case 'Staff':
        navigate('/staff')
        break
      case 'My Shops':
        navigate('/shops')
        break
      case 'Favorite Salons':
        navigate('/favorites')
        break
      case 'Dashboard':
        // Already on dashboard
        break
      default:
        console.log(`Navigate to ${item}`)
    }
  }

  const getSidebarItems = () => {
    switch (userRole) {
      case 'client':
        return ['Dashboard', 'My Bookings', 'Favorite Salons', 'Rewards', 'Profile', 'Settings']
      case 'admin':
        return ['Dashboard', 'User Management', 'Salon Verification', 'Analytics', 'Reports', 'System Health', 'Settings']
      default: // vendor
        return ['Dashboard', 'Appointments', 'My Shops', 'Services', 'Staff', 'Reviews', 'Revenue', 'Marketing', 'Shop']
    }
  }

  return (
    <div className="page dashboard-page">
      <Header />
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav aria-label="Dashboard navigation">
            {getSidebarItems().map((item) => (
              <button
                key={item}
                type="button"
                className="sidebar-item"
                onClick={() => handleNavigation(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main">
          <h1>{greeting}</h1>

          {userRole === 'client' && (
            <>
              <section className="dashboard-summary" aria-label="Client overview">
                <div className="summary-card">
                  <p className="summary-title">Reward Points</p>
                  <p className="summary-status">
                    <span className="points-value">{clientData.rewardPoints.toLocaleString()}</span> points
                  </p>
                  <button type="button" className="pill-button">
                    Redeem Points
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Next Appointment</p>
                  <p className="summary-subtitle">
                    Beauty Paradise - Tomorrow 2:00 PM
                  </p>
                  <button type="button" className="pill-button">
                    View Details
                  </button>
                </div>
              </section>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <section className="dashboard-summary" aria-label="Admin overview">
                <div className="summary-card">
                  <p className="summary-title">System Status</p>
                  <p className="summary-status">
                    <span className="status-dot" aria-hidden="true" /> {adminData.platformStats.systemUptime} Uptime
                  </p>
                  <button type="button" className="pill-button">
                    View System Health
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Pending Verifications</p>
                  <p className="summary-subtitle">
                    {adminData.platformStats.pendingVerifications} salons awaiting verification
                  </p>
                  <button type="button" className="pill-button">
                    Review Verifications
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Platform Revenue</p>
                  <p className="summary-status">
                    <span className="revenue-value">{adminData.revenueMetrics.totalRevenue}</span>
                    <span className="delta positive">{adminData.revenueMetrics.monthlyGrowth}</span>
                  </p>
                  <button type="button" className="pill-button">
                    View Analytics
                  </button>
                </div>
              </section>
            </>
          )}

          {userRole === 'vendor' && (
            <section className="dashboard-summary" aria-label="Salon overview">
              <div className="summary-card">
                <p className="summary-title">My Shops</p>
                <p className="summary-subtitle">
                  {shopsLoading
                    ? 'Loading shops...'
                    : `You have ${vendorShops.length} ${vendorShops.length === 1 ? 'shop' : 'shops'} registered.`
                  }
                </p>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => navigate('/shops')}
                >
                  Manage Shops
                </button>
              </div>

              <div className="summary-card">
                <p className="summary-title">Shop Status</p>
                <div className="summary-status">
                  {shopsLoading ? (
                    'Loading...'
                  ) : vendorShops.length === 0 ? (
                    <span>No shops yet</span>
                  ) : (
                    <div>
                      {vendorShops.filter(s => s.verification_status === 'approved').length > 0 && (
                        <p><span className="status-dot approved" /> {vendorShops.filter(s => s.verification_status === 'approved').length} Approved</p>
                      )}
                      {vendorShops.filter(s => s.verification_status === 'pending').length > 0 && (
                        <p><span className="status-dot pending" /> {vendorShops.filter(s => s.verification_status === 'pending').length} Pending</p>
                      )}
                      {vendorShops.filter(s => s.verification_status === 'rejected').length > 0 && (
                        <p><span className="status-dot rejected" /> {vendorShops.filter(s => s.verification_status === 'rejected').length} Need Review</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => navigate('/shops/new')}
                >
                  Add New Shop
                </button>
              </div>

              <div className="summary-card">
                <p className="summary-title">Loyalty Program</p>
                <p className="summary-subtitle">
                  Loyalty program has been activated in your salon.
                </p>
                <button type="button" className="pill-button">
                  Manage Loyalty Program
                </button>
              </div>
            </section>
          )}

          {userRole === 'client' && (
            <>
              <section className="schedule-section" aria-label="Nearby salons">
                <header className="section-header">
                  <div>
                    <p className="section-date">Available Today</p>
                    <h2>Nearby Salons</h2>
                  </div>
                  <button type="button" className="primary-button">
                    Find More Salons
                  </button>
                </header>
                <div className="schedule-grid">
                  {clientData.nearbyShops.map((shop) => (
                    <article key={shop.name} className="schedule-card">
                      <h3>{shop.name}</h3>
                      <p className="distance">{shop.distance} away</p>
                      <p className="rating">★ {shop.rating}</p>
                      <p className="availability">Next: {shop.nextAvailable}</p>
                      <button type="button" className="pill-button">
                        Book Now
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="schedule-section" aria-label="Popular salons">
                <header className="section-header">
                  <div>
                    <h2>Most Popular Salons</h2>
                  </div>
                </header>
                <div className="schedule-grid">
                  {clientData.popularShops.map((shop) => (
                    <article key={shop.name} className="schedule-card">
                      <h3>{shop.name}</h3>
                      <p className="bookings">{shop.bookings} bookings this month</p>
                      <p className="rating">★ {shop.rating}</p>
                      <button type="button" className="pill-button">
                        View Details
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <section className="schedule-section" aria-label="Platform metrics">
                <header className="section-header">
                  <div>
                    <p className="section-date">Real-time Data</p>
                    <h2>Platform Metrics</h2>
                  </div>
                  <button type="button" className="primary-button">
                    Generate Report
                  </button>
                </header>
                <div className="admin-metrics-grid">
                  <div className="metric-card">
                    <h3>Total Users</h3>
                    <p className="metric-value">{adminData.platformStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="metric-card">
                    <h3>Active Salons</h3>
                    <p className="metric-value">{adminData.platformStats.activeSalons}</p>
                  </div>
                  <div className="metric-card">
                    <h3>Today's Appointments</h3>
                    <p className="metric-value">{adminData.appointmentTrends.todayAppointments.toLocaleString()}</p>
                    <span className="delta positive">{adminData.appointmentTrends.weeklyGrowth}</span>
                  </div>
                  <div className="metric-card">
                    <h3>Loyalty Members</h3>
                    <p className="metric-value">{adminData.loyaltyProgram.activeMembers.toLocaleString()}</p>
                    <p className="metric-subtitle">{adminData.loyaltyProgram.programUsage} engagement</p>
                  </div>
                </div>
              </section>

              <section className="schedule-section" aria-label="Pending actions">
                <header className="section-header">
                  <div>
                    <h2>Pending Actions</h2>
                  </div>
                </header>
                <div className="pending-actions">
                  {adminData.pendingActions.map((action, index) => (
                    <div key={index} className={`action-item ${action.priority}`}>
                      <div className="action-details">
                        <h4>{action.type === 'verification' ? 'Salon Verification' : 'Report Generation'}</h4>
                        <p>{action.salon || action.item}</p>
                      </div>
                      <span className={`priority-badge ${action.priority}`}>{action.priority}</span>
                      <button type="button" className="pill-button">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {userRole === 'vendor' && (
            <section className="schedule-section" aria-label="Today schedule">
              <header className="section-header">
                <div>
                  <p className="section-date">Today, Friday, Oct. 10</p>
                  <h2>Schedule</h2>
                </div>
                <button type="button" className="primary-button">
                  View Full Schedule
                </button>
              </header>
              <div className="schedule-grid">
                {demoSchedule.map((column) => (
                  <article key={column.stylist} className="schedule-card">
                    <h3>{column.stylist}</h3>
                    <ul>
                      {column.rows.map((row) => (
                        <li key={`${column.stylist}-${row.time}`}>
                          <p className="time">{row.time}</p>
                          <p className="client">Client: {row.client}</p>
                          <p className="service">Service: {row.service}</p>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="dashboard-bottom">
            {userRole === 'client' && (
              <>
                <article className="reviews-card" aria-label="Recent visits">
                  <header>
                    <h2>Your Recent Visits</h2>
                  </header>
                  <div className="visits-list">
                    {clientData.recentVisits.map((visit, index) => (
                      <div key={index} className="visit-item">
                        <div className="visit-details">
                          <p className="visit-salon">{visit.salon}</p>
                          <p className="visit-service">{visit.service}</p>
                          <p className="visit-date">{visit.date}</p>
                        </div>
                        <div className="visit-rating">
                          <span className="rating">★ {visit.rating}</span>
                          <button type="button" className="pill-button">
                            Book Again
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="performance-card" aria-label="Rewards summary">
                  <header>
                    <h2>Rewards Summary</h2>
                  </header>
                  <div className="rewards-stats">
                    <div className="reward-item">
                      <h4>Current Points</h4>
                      <p className="reward-value">{clientData.rewardPoints.toLocaleString()}</p>
                    </div>
                    <div className="reward-item">
                      <h4>Points to Next Reward</h4>
                      <p className="reward-value">550</p>
                    </div>
                    <div className="reward-item">
                      <h4>Available Rewards</h4>
                      <p className="reward-value">12</p>
                    </div>
                    <button type="button" className="primary-button">
                      View All Rewards
                    </button>
                  </div>
                </article>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <article className="reviews-card" aria-label="System insights">
                  <header>
                    <h2>System Insights</h2>
                  </header>
                  <div className="insights-list">
                    <div className="insight-item">
                      <h4>Peak Usage Hours</h4>
                      <p>{adminData.appointmentTrends.peakHours}</p>
                    </div>
                    <div className="insight-item">
                      <h4>Average Salon Revenue</h4>
                      <p>{adminData.revenueMetrics.avgSalonRevenue}</p>
                    </div>
                    <div className="insight-item">
                      <h4>Points Redeemed This Month</h4>
                      <p>{adminData.loyaltyProgram.pointsRedeemed}</p>
                    </div>
                  </div>
                </article>

                <article className="performance-card" aria-label="Customer analytics">
                  <header>
                    <h2>Customer Analytics</h2>
                  </header>
                  <div className="performance-stats">
                    <dl>
                      <div>
                        <dt>Customer Retention</dt>
                        <dd>78.5%</dd>
                        <span className="delta positive">+5.2%</span>
                      </div>
                      <div>
                        <dt>User Satisfaction</dt>
                        <dd>4.7/5</dd>
                        <span className="delta positive">+0.3</span>
                      </div>
                    </dl>
                    <div className="performance-chart" aria-hidden="true">
                      <div className="chart-circle">
                        <span className="chart-value">94%</span>
                        <span className="chart-label">Platform Health</span>
                      </div>
                    </div>
                  </div>
                </article>
              </>
            )}

            {userRole === 'vendor' && (
              <>
                <article className="reviews-card" aria-label="Recent review">
                  <header>
                    <h2>Recent Reviews</h2>
                  </header>
                  <div className="review-body">
                    <p className="review-rating" aria-label="Rating: 5 out of 5">
                      ★★★★★
                    </p>
                    <p className="review-title">Love Beauty Cuts</p>
                    <p className="review-text">
                      Sarah was great. Would recommend this salon.
                    </p>
                    <p className="review-meta">Anya S • 10/10/25</p>
                    <button type="button" className="pill-button">
                      Reply
                    </button>
                  </div>
                </article>

                <article className="performance-card" aria-label="Performance snapshot">
                  <header>
                    <h2>Performance Snapshot</h2>
                  </header>
                  <div className="performance-stats">
                    <dl>
                      <div>
                        <dt>Monthly Bookings</dt>
                        <dd>{demoStats.bookings.value}</dd>
                        <span className="delta positive">{demoStats.bookings.delta}</span>
                      </div>
                      <div>
                        <dt>Total Revenue</dt>
                        <dd>{demoStats.revenue.value}</dd>
                        <span className="delta positive">{demoStats.revenue.delta}</span>
                      </div>
                    </dl>
                    <div className="performance-chart" aria-hidden="true">
                      <div className="chart-circle">
                        <span className="chart-value">{demoStats.totalSales}</span>
                        <span className="chart-label">Total Sales</span>
                      </div>
                    </div>
                  </div>
                </article>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
