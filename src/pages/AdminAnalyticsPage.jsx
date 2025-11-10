import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { getAnalyticsData, getRealtimeAnalytics } from '../api/admin'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import './admin-analytics.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
)

function AdminAnalyticsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analyticsData, setAnalyticsData] = useState(null)
  const [realtimeData, setRealtimeData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [realtimeLoading, setRealtimeLoading] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months')

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await getAnalyticsData()
      setAnalyticsData(response.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch realtime data
  const fetchRealtimeData = async () => {
    try {
      setRealtimeLoading(true)
      const response = await getRealtimeAnalytics()
      setRealtimeData(response.realtime)
    } catch (error) {
      console.error('Error fetching realtime data:', error)
    } finally {
      setRealtimeLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData()
    fetchRealtimeData()

    // Set up realtime updates every 30 seconds
    const interval = setInterval(fetchRealtimeData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Chart data preparation
  const getUserGrowthData = () => {
    if (!analyticsData?.user_growth) return null

    return {
      labels: analyticsData.user_growth.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'New Users',
        data: analyticsData.user_growth.map(item => item.count),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    }
  }

  const getSalonGrowthData = () => {
    if (!analyticsData?.salon_growth) return null

    return {
      labels: analyticsData.salon_growth.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'New Salons',
        data: analyticsData.salon_growth.map(item => item.count),
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    }
  }

  const getAppointmentTrendsData = () => {
    if (!analyticsData?.appointment_trends) return null

    return {
      labels: analyticsData.appointment_trends.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'Appointments',
        data: analyticsData.appointment_trends.map(item => item.count),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        borderWidth: 1,
      }]
    }
  }

  const getRevenueTrendsData = () => {
    if (!analyticsData?.revenue_trends) return null

    return {
      labels: analyticsData.revenue_trends.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'Revenue ($)',
        data: analyticsData.revenue_trends.map(item => item.revenue),
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    }
  }

  const getUserRoleDistributionData = () => {
    if (!analyticsData?.user_role_distribution) return null

    const roles = Object.keys(analyticsData.user_role_distribution)
    const counts = Object.values(analyticsData.user_role_distribution)

    return {
      labels: roles.map(role => role.charAt(0).toUpperCase() + role.slice(1) + 's'),
      datasets: [{
        data: counts,
        backgroundColor: ['#667eea', '#764ba2', '#f093fb'],
        borderWidth: 2,
      }]
    }
  }

  const getSalonStatusDistributionData = () => {
    if (!analyticsData?.salon_status_distribution) return null

    const statuses = Object.keys(analyticsData.salon_status_distribution)
    const counts = Object.values(analyticsData.salon_status_distribution)

    return {
      labels: statuses.map(status => status.charAt(0).toUpperCase() + status.slice(1)),
      datasets: [{
        data: counts,
        backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        borderWidth: 2,
      }]
    }
  }

  const getPeakHoursData = () => {
    if (!analyticsData?.peak_hours) return null

    const hours = []
    const counts = []

    for (let i = 0; i < 24; i++) {
      hours.push(`${i}:00`)
      counts.push(analyticsData.peak_hours[i] || 0)
    }

    return {
      labels: hours,
      datasets: [{
        label: 'Appointments',
        data: counts,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        borderWidth: 1,
      }]
    }
  }

  const getPopularServicesData = () => {
    if (!analyticsData?.popular_services) return null

    return {
      labels: analyticsData.popular_services.map(item => item.service),
      datasets: [{
        label: 'Bookings',
        data: analyticsData.popular_services.map(item => item.bookings),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
          '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'
        ],
        borderWidth: 1,
      }]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  }

  return (
    <div className="page admin-analytics-page">
      <Header />
      <main className="analytics-container">
        <div className="analytics-header">
          <h1>Data Analytics & Visualizations</h1>
          <p className="subtitle">Comprehensive insights into platform performance and trends</p>
        </div>

        {/* Real-time Metrics */}
        {realtimeLoading ? (
          <div className="loading">Loading real-time metrics...</div>
        ) : realtimeData ? (
          <section className="realtime-section">
            <h2>Real-time Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h3>{realtimeData.current_metrics.total_users.toLocaleString()}</h3>
                  <p>Total Users</p>
                  <span className="trend positive">
                    +{realtimeData.trends.user_growth_wow}% WoW
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🏪</div>
                <div className="metric-content">
                  <h3>{realtimeData.current_metrics.total_salons.toLocaleString()}</h3>
                  <p>Total Salons</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📅</div>
                <div className="metric-content">
                  <h3>{realtimeData.current_metrics.total_appointments.toLocaleString()}</h3>
                  <p>Total Appointments</p>
                  <span className="trend positive">
                    +{realtimeData.trends.appointment_growth_wow}% WoW
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <h3>${realtimeData.current_metrics.total_revenue.toLocaleString()}</h3>
                  <p>Total Revenue</p>
                  <span className="trend positive">
                    +{realtimeData.trends.revenue_growth_mom}% MoM
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">⏰</div>
                <div className="metric-content">
                  <h3>{realtimeData.current_metrics.active_appointments_today}</h3>
                  <p>Today's Appointments</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <h3>{realtimeData.current_metrics.pending_verifications}</h3>
                  <p>Pending Verifications</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Growth Trends */}
        <section className="charts-section">
          <h2>Growth Trends</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>User Growth</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getUserGrowthData() ? (
                  <Line data={getUserGrowthData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Salon Growth</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getSalonGrowthData() ? (
                  <Line data={getSalonGrowthData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Appointment Trends</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getAppointmentTrendsData() ? (
                  <Bar data={getAppointmentTrendsData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Revenue Trends</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getRevenueTrendsData() ? (
                  <Line data={getRevenueTrendsData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Distribution Charts */}
        <section className="distribution-section">
          <h2>Platform Distribution</h2>
          <div className="distribution-grid">
            <div className="chart-card">
              <h3>User Roles</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getUserRoleDistributionData() ? (
                  <Doughnut data={getUserRoleDistributionData()} options={doughnutOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Salon Status</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getSalonStatusDistributionData() ? (
                  <Doughnut data={getSalonStatusDistributionData()} options={doughnutOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Popular Services</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getPopularServicesData() ? (
                  <Bar data={getPopularServicesData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Peak Hours</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getPeakHoursData() ? (
                  <Bar data={getPeakHoursData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* System Health */}
        {realtimeData?.system_health && (
          <section className="health-section">
            <h2>System Health</h2>
            <div className="health-grid">
              <div className="health-card">
                <h3>User Retention</h3>
                <div className="health-value">{realtimeData.system_health.user_retention_rate}%</div>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${realtimeData.system_health.user_retention_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="health-card">
                <h3>Salon Approval Rate</h3>
                <div className="health-value">{realtimeData.system_health.salon_approval_rate}%</div>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${realtimeData.system_health.salon_approval_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="health-card">
                <h3>Average Rating</h3>
                <div className="health-value">{realtimeData.system_health.average_rating}/5</div>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${(realtimeData.system_health.average_rating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="health-card">
                <h3>Appointment Completion</h3>
                <div className="health-value">{realtimeData.system_health.appointment_completion_rate}%</div>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${realtimeData.system_health.appointment_completion_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminAnalyticsPage