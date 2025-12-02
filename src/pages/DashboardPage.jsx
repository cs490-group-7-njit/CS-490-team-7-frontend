import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAppointments } from '../api/appointments'
import { getMyShops } from '../api/shops'
import { getSalonAppointments } from '../api/vendorAppointments'
import { getSalonReviews } from '../api/reviews'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './dashboard.css'

/*
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
  nearbyShops: [
    { name: 'Beauty Paradise', distance: '0.3 miles', rating: 4.8, nextAvailable: 'Today 2:00 PM' },
    { name: 'Style Studio', distance: '0.5 miles', rating: 4.6, nextAvailable: 'Tomorrow 10:00 AM' },
    { name: 'Glamour Lounge', distance: '0.7 miles', rating: 4.9, nextAvailable: 'Today 4:30 PM' }
  ],
  popularShops: [
    { name: 'Trendy Cuts', bookings: 1250, rating: 4.9 },
    { name: 'Elite Salon', bookings: 980, rating: 4.8 },
    { name: 'Beauty Hub', bookings: 875, rating: 4.7 }
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
 */
function DashboardPage() {
  const { user, refreshActivity } = useAuth()
  const navigate = useNavigate()
  const [vendorShops, setVendorShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)
  const [vendorSchedule, setVendorSchedule] = useState([])
  const [vendorScheduleLoading, setVendorScheduleLoading] = useState(false)
  const [vendorScheduleError, setVendorScheduleError] = useState(null)
  const [vendorReview, setVendorReview] = useState(null)
  const [vendorReviewLoading, setVendorReviewLoading] = useState(false)
  const [vendorReviewError, setVendorReviewError] = useState(null)
  const [vendorMetrics, setVendorMetrics] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    completionRate: 0,
    completedLast30: 0,
  })
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [nextAppointment, setNextAppointment] = useState(null)
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [recentVisits, setRecentVisits] = useState([])
  const [recentVisitsLoading, setRecentVisitsLoading] = useState(false)

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

  // Fetch loyalty points if user is a client
  useEffect(() => {
    if (user?.role === 'client' && user?.id) {
      fetchLoyaltyPoints()
    }
  }, [user])

  // Fetch next appointment if user is a client
  useEffect(() => {
    if (user?.role === 'client' && user?.id) {
      fetchNextAppointment()
    }
  }, [user])

  // Fetch recent visits if user is a client
  useEffect(() => {
    if (user?.role === 'client' && user?.id) {
      fetchRecentVisits()
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

  const resetVendorInsights = useCallback(() => {
    setVendorSchedule([])
    setVendorScheduleLoading(false)
    setVendorScheduleError(null)
    setVendorMetrics({
      totalAppointments: 0,
      completedAppointments: 0,
      upcomingAppointments: 0,
      completionRate: 0,
      completedLast30: 0,
    })
    setVendorReview(null)
    setVendorReviewLoading(false)
    setVendorReviewError(null)
  }, [])

  const fetchVendorSchedule = useCallback(async () => {
    if (user?.role !== 'vendor') {
      return
    }

    if (!vendorShops.length) {
      resetVendorInsights()
      return
    }

    try {
      setVendorScheduleLoading(true)
      setVendorScheduleError(null)

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const appointmentResults = await Promise.all(
        vendorShops.map(async (salon) => {
          try {
            const appointments = await getSalonAppointments(salon.id)
            return (appointments || []).map((appointment) => ({
              ...appointment,
              salon_name: salon.name,
            }))
          } catch (fetchError) {
            console.error(`Error fetching appointments for salon ${salon.id}`, fetchError)
            return []
          }
        })
      )

      const allAppointments = appointmentResults.flat()

      const upcomingAppointments = allAppointments
        .filter((appointment) => {
          if (!appointment.starts_at) {
            return false
          }
          const startTime = new Date(appointment.starts_at)
          return ['booked', 'in-progress'].includes(appointment.status) && startTime >= now
        })
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))

      const groupedByStaff = new Map()
      upcomingAppointments.forEach((appointment) => {
        const staffKey = appointment.staff_name || 'Unassigned'
        if (!groupedByStaff.has(staffKey)) {
          groupedByStaff.set(staffKey, {
            staffId: appointment.staff_id,
            staffName: staffKey,
            appointments: [],
          })
        }

        groupedByStaff.get(staffKey).appointments.push({
          id: appointment.id,
          starts_at: appointment.starts_at,
          ends_at: appointment.ends_at,
          client_name: appointment.client_name || 'Client',
          service_name: appointment.service_name || 'Service',
          status: appointment.status,
          salon_name: appointment.salon_name,
        })
      })

      const scheduleColumns = Array.from(groupedByStaff.values()).map((column) => ({
        ...column,
        appointments: column.appointments.slice(0, 5),
      }))

      setVendorSchedule(scheduleColumns)

      const totalAppointments = allAppointments.length
      const completedAppointments = allAppointments.filter((appointment) => appointment.status === 'completed').length
      const upcomingCount = upcomingAppointments.length
      const completedLast30 = allAppointments.filter((appointment) => {
        if (appointment.status !== 'completed' || !appointment.starts_at) {
          return false
        }
        return new Date(appointment.starts_at) >= thirtyDaysAgo
      }).length

      setVendorMetrics({
        totalAppointments,
        completedAppointments,
        upcomingAppointments: upcomingCount,
        completionRate: totalAppointments ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        completedLast30,
      })
    } catch (error) {
      console.error('Error building vendor schedule:', error)
      setVendorScheduleError(error.message || 'Failed to load schedule')
    } finally {
      setVendorScheduleLoading(false)
    }
  }, [resetVendorInsights, user?.role, vendorShops])

  const fetchVendorReview = useCallback(async () => {
    if (user?.role !== 'vendor') {
      return
    }

    if (!vendorShops.length) {
      setVendorReview(null)
      return
    }

    try {
      setVendorReviewLoading(true)
      setVendorReviewError(null)

      const reviewResponses = await Promise.all(
        vendorShops.map(async (salon) => {
          try {
            const params = new URLSearchParams({
              limit: 1,
              sort_by: 'date',
              order: 'desc',
            })
            const data = await getSalonReviews(salon.id, params.toString())
            const review = data.reviews?.[0]
            if (review) {
              return {
                ...review,
                salon_name: salon.name,
              }
            }
            return null
          } catch (fetchError) {
            console.error(`Error fetching reviews for salon ${salon.id}`, fetchError)
            return null
          }
        })
      )

      const availableReviews = reviewResponses.filter(Boolean)

      if (!availableReviews.length) {
        setVendorReview(null)
        return
      }

      const latestReview = availableReviews.reduce((latest, review) => {
        if (!latest) {
          return review
        }

        const currentDate = review.created_at ? new Date(review.created_at) : null
        const latestDate = latest.created_at ? new Date(latest.created_at) : null

        if (currentDate && (!latestDate || currentDate > latestDate)) {
          return review
        }
        return latest
      }, null)

      setVendorReview(latestReview)
    } catch (error) {
      console.error('Error fetching vendor review:', error)
      setVendorReviewError(error.message || 'Failed to load reviews')
    } finally {
      setVendorReviewLoading(false)
    }
  }, [user?.role, vendorShops])

  useEffect(() => {
    if (user?.role !== 'vendor') {
      resetVendorInsights()
      return
    }

    if (!vendorShops.length) {
      resetVendorInsights()
      return
    }

    fetchVendorSchedule()
    fetchVendorReview()
  }, [fetchVendorReview, fetchVendorSchedule, resetVendorInsights, user?.role, vendorShops])

  const fetchLoyaltyPoints = async () => {
    try {
      setLoyaltyLoading(true)
      const response = await fetch(`/users/${user.id}/loyalty`)
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data)
      }
    } catch (error) {
      console.error('Error fetching loyalty points:', error)
    } finally {
      setLoyaltyLoading(false)
    }
  }

  const fetchNextAppointment = async () => {
    try {
      setAppointmentsLoading(true)
      const appointments = await listAppointments()

      // Filter for upcoming booked appointments
      const now = new Date()
      const upcomingAppointments = appointments
        .filter(apt => apt.status === 'booked' && new Date(apt.starts_at) > now)
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))

      if (upcomingAppointments.length > 0) {
        setNextAppointment(upcomingAppointments[0])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const fetchRecentVisits = async () => {
    try {
      setRecentVisitsLoading(true)
      const appointments = await listAppointments()

      // Filter for completed appointments, sorted by most recent
      const completedAppointments = appointments
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
        .slice(0, 3) // Get only the 3 most recent

      const visits = completedAppointments.map(apt => ({
        salon: apt.salon_name,
        service: apt.service_name,
        date: new Date(apt.starts_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        rating: 0 // Default rating, could be enhanced later with review data
      }))

      setRecentVisits(visits)
    } catch (error) {
      console.error('Error fetching recent visits:', error)
      setRecentVisits([])
    } finally {
      setRecentVisitsLoading(false)
    }
  }

  const userRole = user?.role || 'client'

  const greeting = useMemo(() => {
    const name = user?.name || (userRole === 'admin' ? 'Admin' : userRole === 'client' ? 'Client' : 'Vendor')
    const firstName = name.split(' ')[0]
    return `Welcome to your Dashboard, ${firstName}`
  }, [user, userRole])

  const formatAppointmentTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatAppointmentWindow = (startIso, endIso) => {
    if (!startIso) {
      return 'TBD'
    }

    const start = new Date(startIso)
    const startLabel = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    if (!endIso) {
      return startLabel
    }

    const end = new Date(endIso)
    const endLabel = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    return `${startLabel} – ${endLabel}`
  }

  const formatDashboardDate = (dateIso) => {
    if (!dateIso) {
      return ''
    }

    return new Date(dateIso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatStatusLabel = (status) => {
    if (!status) {
      return ''
    }
    return status
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  }

  const renderRatingStars = (rating) => {
    if (!rating) {
      return '☆☆☆☆☆'
    }
    const capped = Math.max(0, Math.min(5, Math.round(rating)))
    return `${'★'.repeat(capped)}${'☆'.repeat(5 - capped)}`
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  const handleNavigation = (item) => {
    switch (item) {
      case 'Staff':
        navigate('/staff')
        break
      case 'My Shops':
        navigate('/shops')
        break
      case 'Appointments':
        navigate(userRole === 'vendor' ? '/vendor/appointments' : '/appointments')
        break
      case 'My Bookings':
        navigate('/appointments/history')
        break
      case 'Messages':
        navigate('/messages')
        break
      case 'Notifications':
        navigate('/notifications')
        break
      case 'Rewards':
        navigate('/loyalty-points')
        break
      case 'Favorite Salons':
        navigate('/favorites')
        break
      case 'Profile':
        navigate('/profile/edit')
        break
      case 'Services':
        navigate('/services')
        break
      case 'Reviews':
        navigate(userRole === 'vendor' ? '/vendor/reviews' : '/reviews')
        break
      case 'Revenue':
        navigate(userRole === 'vendor' ? '/salons/1/analytics' : '/revenue')
        break
      case 'Marketing':
        navigate('/marketing')
        break
      case 'Shop':
        navigate(userRole === 'vendor' ? '/salons/1' : '/shops')
        break

      // Admin sidebar items
      case 'User Management':
        navigate('/admin/users')
        break
      case 'Salon Management':
        navigate('/admin/salons')
        break
      case 'Data Analytics':
        navigate('/admin/analytics')
        break
      case 'Salon Verification':
        // For now, route to admin salons where verification happens
        navigate('/admin/salons')
        break
      case 'Analytics':
        navigate('/admin/analytics')
        break
      case 'Reports':
        // No dedicated reports page yet – use analytics for now
        navigate('/admin/analytics')
        break
      case 'System Health':
        navigate('/admin/health')
        break
      case 'Settings':
        navigate('/admin/settings')
        break

      case 'Dashboard':
        navigate('/dashboard')
        break
      default:
        console.log(`Navigate to ${item}`)
    }
  }

  const getSidebarItems = () => {
    switch (userRole) {
      case 'client':
        return ['Dashboard', 'My Bookings', 'Messages', 'Notifications', 'Favorite Salons', 'Rewards', 'Profile']
      case 'admin':
        return ['Dashboard', 'User Management', 'Salon Management', 'Data Analytics', 'Salon Verification', 'Analytics', 'Reports', 'System Health', 'Settings']
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
                    <span className="points-value">{loyaltyLoading ? 'Loading...' : (loyaltyData?.total_points || 0).toLocaleString()}</span> points
                  </p>
                  <button type="button" className="pill-button">
                    Redeem Points
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Next Appointment</p>
                  <p className="summary-subtitle">
                    {appointmentsLoading
                      ? 'Loading...'
                      : nextAppointment
                        ? `${nextAppointment.salon_name} - ${formatAppointmentTime(nextAppointment.starts_at)}`
                        : 'No upcoming appointments'
                    }
                  </p>
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => navigate('/appointments/history')}
                  >
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
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => navigate('/admin/health')}
                  >
                    View System Health
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Pending Verifications</p>
                  <p className="summary-subtitle">
                    {adminData.platformStats.pendingVerifications} salons awaiting verification
                  </p>
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => navigate('/admin/salons')}
                  >
                    Review Verifications
                  </button>
                </div>

                <div className="summary-card">
                  <p className="summary-title">Platform Revenue</p>
                  <p className="summary-status">
                    <span className="revenue-value">{adminData.revenueMetrics.totalRevenue}</span>
                    <span className="delta positive">{adminData.revenueMetrics.monthlyGrowth}</span>
                  </p>
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => navigate('/admin/analytics')}
                  >
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
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate('/salons/search')}
                  >
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
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() => navigate('/salons/search')}
                      >
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
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() => navigate('/salons/search')}
                      >
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
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate('/admin/analytics')}
                  >
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
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() =>
                          action.type === 'verification'
                            ? navigate('/admin/salons')
                            : navigate('/admin/analytics')
                        }
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {userRole === 'vendor' && (
            <section className="schedule-section" aria-label="Upcoming schedule">
              <header className="section-header">
                <div>
                  <p className="section-date">Today, {todayLabel}</p>
                  <h2>Schedule</h2>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate('/vendor/appointments')}
                >
                  View Full Schedule
                </button>
              </header>
              <div className="schedule-grid">
                {vendorScheduleLoading ? (
                  <article className="schedule-card">
                    <p>Loading schedule...</p>
                  </article>
                ) : vendorScheduleError ? (
                  <article className="schedule-card">
                    <p>{vendorScheduleError}</p>
                  </article>
                ) : vendorSchedule.length ? (
                  vendorSchedule.map((column) => (
                    <article key={column.staffId || column.staffName} className="schedule-card">
                      <h3>{column.staffName}</h3>
                      <ul>
                        {column.appointments.map((appointment) => (
                          <li key={appointment.id}>
                            <p className="time">{formatAppointmentWindow(appointment.starts_at, appointment.ends_at)}</p>
                            {appointment.salon_name && (
                              <p className="salon">Salon: {appointment.salon_name}</p>
                            )}
                            <p className="client">Client: {appointment.client_name}</p>
                            <p className="service">Service: {appointment.service_name}</p>
                            <p className="status">Status: {formatStatusLabel(appointment.status)}</p>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))
                ) : (
                  <article className="schedule-card">
                    <p>No upcoming appointments yet.</p>
                  </article>
                )}
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
                    {recentVisitsLoading ? (
                      <p>Loading recent visits...</p>
                    ) : recentVisits.length > 0 ? (
                      recentVisits.map((visit, index) => (
                        <div key={index} className="visit-item">
                          <div className="visit-details">
                            <p className="visit-salon">{visit.salon}</p>
                            <p className="visit-service">{visit.service}</p>
                            <p className="visit-date">{visit.date}</p>
                          </div>
                          <div className="visit-rating">
                            <span className="rating">★ {visit.rating || 'No rating'}</span>
                            <button type="button" className="pill-button">
                              Book Again
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No completed appointments yet. Book an appointment to see your visit history.</p>
                    )}
                  </div>
                </article>

                <article className="performance-card" aria-label="Rewards summary">
                  <header>
                    <h2>Rewards Summary</h2>
                  </header>
                  <div className="rewards-stats">
                    <div className="reward-item">
                      <h4>Current Points</h4>
                      <p className="reward-value">{loyaltyLoading ? 'Loading...' : (loyaltyData?.total_points || 0).toLocaleString()}</p>
                    </div>
                    <div className="reward-item">
                      <h4>Points to Next Reward</h4>
                      <p className="reward-value">550</p>
                    </div>
                    <div className="reward-item">
                      <h4>Available Rewards</h4>
                      <p className="reward-value">12</p>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => navigate('/loyalty-points')}
                    >
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
                    {vendorReviewLoading ? (
                      <p>Loading review...</p>
                    ) : vendorReviewError ? (
                      <p>{vendorReviewError}</p>
                    ) : vendorReview ? (
                      <>
                        <p
                          className="review-rating"
                          aria-label={`Rating: ${vendorReview.rating || 0} out of 5`}
                        >
                          {vendorReview.rating ? renderRatingStars(vendorReview.rating) : 'No rating yet'}
                        </p>
                        <p className="review-title">{vendorReview.salon_name}</p>
                        <p className="review-text">
                          {vendorReview.comment || 'No comment provided.'}
                        </p>
                        <p className="review-meta">
                          {vendorReview.client_name || 'Anonymous'}
                          {vendorReview.created_at ? ` • ${formatDashboardDate(vendorReview.created_at)}` : ''}
                        </p>
                        <button
                          type="button"
                          className="pill-button"
                          onClick={() => navigate('/vendor/reviews')}
                        >
                          Reply
                        </button>
                      </>
                    ) : (
                      <p>No reviews yet. Invite clients to share their experience.</p>
                    )}
                  </div>
                </article>

                <article className="performance-card" aria-label="Performance snapshot">
                  <header>
                    <h2>Performance Snapshot</h2>
                  </header>
                  <div className="performance-stats">
                    <dl>
                      <div>
                        <dt>Total Appointments</dt>
                        <dd>{vendorMetrics.totalAppointments}</dd>
                        <span className="delta">Across all salons</span>
                      </div>
                      <div>
                        <dt>Upcoming Appointments</dt>
                        <dd>{vendorMetrics.upcomingAppointments}</dd>
                        <span className="delta">Next confirmed visits</span>
                      </div>
                      <div>
                        <dt>Completion Rate</dt>
                        <dd>{vendorMetrics.completionRate}%</dd>
                        <span className="delta positive">
                          {vendorMetrics.completedAppointments} completed overall
                        </span>
                      </div>
                    </dl>
                    <div className="performance-chart" aria-hidden="true">
                      <div className="chart-circle">
                        <span className="chart-value">{vendorMetrics.completedLast30}</span>
                        <span className="chart-label">Completed last 30 days</span>
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
