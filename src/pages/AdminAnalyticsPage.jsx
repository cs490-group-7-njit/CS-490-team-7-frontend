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
    if (!analyticsData?.peak_hours?.hourly) return null

    const hours = []
    const counts = []

    for (let i = 0; i < 24; i++) {
      hours.push(`${i}:00`)
      counts.push(analyticsData.peak_hours.hourly[i] || 0)
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

  const getPeakHoursByDayData = () => {
    if (!analyticsData?.peak_hours?.by_day) return null

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const datasets = []

    days.forEach(day => {
      const dayData = analyticsData.peak_hours.by_day[day] || {}
      const data = []
      
      for (let hour = 0; hour < 24; hour++) {
        data.push(dayData[hour] || 0)
      }
      
      datasets.push({
        label: day,
        data: data,
        borderColor: getDayColor(day),
        backgroundColor: getDayColor(day, 0.1),
        tension: 0.4,
        fill: false,
      })
    })

    const labels = []
    for (let i = 0; i < 24; i++) {
      labels.push(`${i}:00`)
    }

    return {
      labels,
      datasets
    }
  }

  const getAppointmentTrendsByDayData = () => {
    if (!analyticsData?.appointment_trends_by_day) return null

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const data = days.map(day => analyticsData.appointment_trends_by_day[day] || 0)

    return {
      labels: days,
      datasets: [{
        label: 'Appointments',
        data: data,
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
          '#45b7d1', '#96ceb4'
        ],
        borderWidth: 1,
      }]
    }
  }

  const getPeakPeriodsData = () => {
    if (!analyticsData?.peak_hours?.by_period) return null

    const periods = Object.keys(analyticsData.peak_hours.by_period)
    const data = Object.values(analyticsData.peak_hours.by_period)

    return {
      labels: periods.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
      datasets: [{
        data: data,
        backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        borderWidth: 2,
      }]
    }
  }

  // UC 3.6: Salon Revenue Tracking
  const getTopSalonsByRevenueData = () => {
    if (!analyticsData?.salon_revenue?.top_salons) return null

    return {
      labels: analyticsData.salon_revenue.top_salons.map(salon => salon.name),
      datasets: [{
        label: 'Revenue ($)',
        data: analyticsData.salon_revenue.top_salons.map(salon => salon.revenue),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
          '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'
        ],
        borderWidth: 1,
      }]
    }
  }

  const getRevenueByCategoryData = () => {
    if (!analyticsData?.revenue_by_category) return null

    const categories = Object.keys(analyticsData.revenue_by_category)
    const revenues = categories.map(cat => analyticsData.revenue_by_category[cat].revenue)

    return {
      labels: categories,
      datasets: [{
        label: 'Revenue ($)',
        data: revenues,
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
          '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'
        ],
        borderWidth: 1,
      }]
    }
  }

  const getSalonRevenueTrendsData = () => {
    if (!analyticsData?.salon_revenue?.monthly_trends) return null

    const salonNames = Object.keys(analyticsData.salon_revenue.monthly_trends)
    const datasets = salonNames.map((salonName, index) => ({
      label: salonName,
      data: analyticsData.salon_revenue.monthly_trends[salonName].map(item => item.revenue),
      borderColor: getRevenueColor(index),
      backgroundColor: getRevenueColor(index, 0.1),
      tension: 0.4,
      fill: false,
    }))

    const labels = analyticsData.salon_revenue.monthly_trends[salonNames[0]]?.map(item => {
      const date = new Date(item.month + '-01')
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }) || []

    return {
      labels,
      datasets
    }
  }

  // UC 3.7: Loyalty Program Monitoring
  const getLoyaltyActivityTrendsData = () => {
    if (!analyticsData?.loyalty_program?.activity_trends) return null

    const labels = analyticsData.loyalty_program.activity_trends.map(item => {
      const date = new Date(item.month + '-01')
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Points Earned',
          data: analyticsData.loyalty_program.activity_trends.map(item => item.earned),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Points Redeemed',
          data: analyticsData.loyalty_program.activity_trends.map(item => item.redeemed),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.4,
          fill: false,
        }
      ]
    }
  }

  const getPopularRewardsData = () => {
    if (!analyticsData?.loyalty_program?.redemption_stats?.popular_rewards) return null

    return {
      labels: analyticsData.loyalty_program.redemption_stats.popular_rewards.map(reward => reward.reward_type),
      datasets: [{
        label: 'Redemptions',
        data: analyticsData.loyalty_program.redemption_stats.popular_rewards.map(reward => reward.count),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4'
        ],
        borderWidth: 1,
      }]
    }
  }

  const getRevenueColor = (index, alpha = 1) => {
    const colors = [
      `rgba(102, 126, 234, ${alpha})`,
      `rgba(118, 75, 162, ${alpha})`,
      `rgba(240, 147, 251, ${alpha})`,
      `rgba(245, 87, 108, ${alpha})`,
      `rgba(78, 205, 196, ${alpha})`
    ]
    return colors[index % colors.length]
  }

  const getDayColor = (day, alpha = 1) => {
    const dayColors = {
      'Monday': `rgba(102, 126, 234, ${alpha})`,
      'Tuesday': `rgba(118, 75, 162, ${alpha})`,
      'Wednesday': `rgba(240, 147, 251, ${alpha})`,
      'Thursday': `rgba(245, 87, 108, ${alpha})`,
      'Friday': `rgba(78, 205, 196, ${alpha})`,
      'Saturday': `rgba(69, 189, 209, ${alpha})`,
      'Sunday': `rgba(150, 206, 180, ${alpha})`
    }
    return dayColors[day] || `rgba(128, 128, 128, ${alpha})`
  }

  const getPopularServicesData = () => {
    if (!analyticsData?.popular_services) return null

    return {
      labels: analyticsData.popular_services.map(service => service.name),
      datasets: [{
        label: 'Bookings',
        data: analyticsData.popular_services.map(service => service.bookings),
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

        {/* Appointment Trends & Peak Hours Analysis - UC 3.5 */}
        <section className="appointment-trends-section">
          <h2>Appointment Trends & Peak Hours Analysis</h2>
          
          {/* Peak Hours Insights */}
          {analyticsData?.peak_hours?.insights && (
            <div className="insights-cards">
              <div className="insight-card">
                <h3>Peak Hours Range</h3>
                <p className="insight-value">{analyticsData.peak_hours.insights.peak_hours_range}</p>
                <p className="insight-label">Most active booking period</p>
              </div>
              
              <div className="insight-card">
                <h3>Busiest Hour</h3>
                <p className="insight-value">{analyticsData.peak_hours.insights.busiest_hour}</p>
                <p className="insight-label">Highest appointment volume</p>
              </div>
              
              <div className="insight-card">
                <h3>Peak Period Coverage</h3>
                <p className="insight-value">{analyticsData.peak_hours.insights.peak_percentage}%</p>
                <p className="insight-label">Of total appointments in peak hours</p>
              </div>
              
              <div className="insight-card">
                <h3>Peak Appointments</h3>
                <p className="insight-value">{analyticsData.peak_hours.insights.total_peak_appointments.toLocaleString()}</p>
                <p className="insight-label">Total bookings during peak hours</p>
              </div>
            </div>
          )}

          <div className="trends-grid">
            <div className="chart-card full-width">
              <h3>Appointments by Day of Week</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getAppointmentTrendsByDayData() ? (
                  <Bar data={getAppointmentTrendsByDayData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Peak Hours by Time Period</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getPeakPeriodsData() ? (
                  <Doughnut data={getPeakPeriodsData()} options={doughnutOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card full-width">
              <h3>Peak Hours by Day of Week</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getPeakHoursByDayData() ? (
                  <Line data={getPeakHoursByDayData()} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Salon Revenue Tracking - UC 3.6 */}
        <section className="salon-revenue-section">
          <h2>Salon Revenue Tracking</h2>
          
          {/* Revenue Insights */}
          {analyticsData?.salon_revenue?.top_salons && analyticsData.salon_revenue.top_salons.length > 0 && (
            <div className="insights-cards">
              <div className="insight-card">
                <h3>Top Performing Salon</h3>
                <p className="insight-value">{analyticsData.salon_revenue.top_salons[0].name}</p>
                <p className="insight-label">${analyticsData.salon_revenue.top_salons[0].revenue.toLocaleString()} revenue</p>
              </div>
              
              <div className="insight-card">
                <h3>Average Revenue/Salon</h3>
                <p className="insight-value">
                  ${(analyticsData.salon_revenue.top_salons.reduce((sum, salon) => sum + salon.revenue, 0) / analyticsData.salon_revenue.top_salons.length).toLocaleString()}
                </p>
                <p className="insight-label">Across top performers</p>
              </div>
              
              <div className="insight-card">
                <h3>Highest Avg/Appointment</h3>
                <p className="insight-value">
                  ${Math.max(...analyticsData.salon_revenue.top_salons.map(s => s.avg_revenue_per_appointment)).toFixed(2)}
                </p>
                <p className="insight-label">Best revenue efficiency</p>
              </div>
              
              <div className="insight-card">
                <h3>Total Revenue</h3>
                <p className="insight-value">
                  ${analyticsData.salon_revenue.top_salons.reduce((sum, salon) => sum + salon.revenue, 0).toLocaleString()}
                </p>
                <p className="insight-label">From top 10 salons</p>
              </div>
            </div>
          )}

          <div className="revenue-grid">
            <div className="chart-card">
              <h3>Top 10 Salons by Revenue</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getTopSalonsByRevenueData() ? (
                  <Bar data={getTopSalonsByRevenueData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Revenue by Category</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getRevenueByCategoryData() ? (
                  <Bar data={getRevenueByCategoryData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card full-width">
              <h3>Revenue Trends - Top 5 Salons</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getSalonRevenueTrendsData() ? (
                  <Line data={getSalonRevenueTrendsData()} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Loyalty Program Monitoring - UC 3.7 */}
        <section className="loyalty-program-section">
          <h2>Loyalty Program Monitoring</h2>
          
          {/* Loyalty Insights */}
          {analyticsData?.loyalty_program?.overview && (
            <div className="insights-cards">
              <div className="insight-card">
                <h3>Total Loyalty Users</h3>
                <p className="insight-value">{analyticsData.loyalty_program.overview.total_users.toLocaleString()}</p>
                <p className="insight-label">Active program members</p>
              </div>
              
              <div className="insight-card">
                <h3>Total Points</h3>
                <p className="insight-value">{analyticsData.loyalty_program.overview.total_points.toLocaleString()}</p>
                <p className="insight-label">Points in circulation</p>
              </div>
              
              <div className="insight-card">
                <h3>Avg Points/User</h3>
                <p className="insight-value">{analyticsData.loyalty_program.overview.avg_points_per_user}</p>
                <p className="insight-label">Average balance per user</p>
              </div>
              
              <div className="insight-card">
                <h3>Engagement Rate</h3>
                <p className="insight-value">{analyticsData.loyalty_program.user_engagement.engagement_rate}%</p>
                <p className="insight-label">Users with 100+ points</p>
              </div>
            </div>
          )}

          <div className="loyalty-grid">
            <div className="chart-card">
              <h3>Loyalty Points Activity</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getLoyaltyActivityTrendsData() ? (
                  <Line data={getLoyaltyActivityTrendsData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Popular Rewards</h3>
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : getPopularRewardsData() ? (
                  <Bar data={getPopularRewardsData()} options={chartOptions} />
                ) : (
                  <div className="chart-error">No data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Redemption Statistics</h3>
              <div className="stats-container">
                {analyticsData?.loyalty_program?.redemption_stats && (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Redemptions</span>
                      <span className="stat-value">{analyticsData.loyalty_program.redemption_stats.total_redemptions.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Points Redeemed</span>
                      <span className="stat-value">{analyticsData.loyalty_program.redemption_stats.total_points_redeemed.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Points/Redemption</span>
                      <span className="stat-value">{analyticsData.loyalty_program.redemption_stats.avg_points_per_redemption}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Recent Redemptions</span>
                      <span className="stat-value">{analyticsData.loyalty_program.user_engagement.recent_redemptions}</span>
                    </div>
                  </div>
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