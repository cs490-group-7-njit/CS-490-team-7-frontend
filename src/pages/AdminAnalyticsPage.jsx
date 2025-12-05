import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateReport as generateReportAPI, getAnalyticsData, getRealtimeAnalytics } from '../api/admin'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
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
  const [reportType, setReportType] = useState('summary')
  const [reportFormat, setReportFormat] = useState('json')
  const [reportPeriod, setReportPeriod] = useState('30d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [recentReports, setRecentReports] = useState([])

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

  // UC 3.8: User Demographics Data
  const getUserCityDistributionData = () => {
    if (!analyticsData?.user_demographics?.by_city) return null

    const labels = Object.keys(analyticsData.user_demographics.by_city)
    const data = Object.values(analyticsData.user_demographics.by_city)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
          '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'
        ],
        borderWidth: 1,
      }]
    }
  }

  const getAccountAgeBucketsData = () => {
    if (!analyticsData?.user_demographics?.account_age_buckets) return null

    const buckets = analyticsData.user_demographics.account_age_buckets
    return {
      labels: ['<1 month', '1-3 months', '3-12 months', '>1 year'],
      datasets: [{
        label: 'Users',
        data: [buckets['<1_month'], buckets['1-3_months'], buckets['3-12_months'], buckets['>1_year']],
        backgroundColor: ['#667eea', '#764ba2', '#4ecdc4', '#f5576c'],
        borderWidth: 1,
      }]
    }
  }

  // UC 3.9: Retention Metrics Data
  const getRetentionSummary = () => {
    if (!analyticsData?.retention_metrics) return null
    return analyticsData.retention_metrics
  }

  const getCohortRetentionData = () => {
    if (!analyticsData?.retention_metrics?.cohort_retention_last_6_months) return null

    const data = analyticsData.retention_metrics.cohort_retention_last_6_months
    return {
      labels: data.map(d => d.month),
      datasets: [{
        label: 'Retention Next Month (%)',
        data: data.map(d => d.retention_next_month === null ? null : d.retention_next_month),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102,126,234,0.1)',
        tension: 0.3,
        fill: false,
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

  // Report generation
  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    setReportData(null)

    try {
      const response = await generateReportAPI({ format: reportFormat })

      if (!response) {
        throw new Error('Empty response from server')
      }

      setReportData({
        type: 'dashboard_summary',
        format: reportFormat,
        generatedAt: response.generated_at || new Date().toLocaleString(),
        content: response.data || {},
        parameters: response.parameters
      })
    } catch (error) {
      console.error('Error generating report:', error)
      setReportData({
        type: 'dashboard_summary',
        format: reportFormat,
        generatedAt: new Date().toLocaleString(),
        content: `Error generating report: ${error.message}`,
        error: true
      })
    } finally {
      setGeneratingReport(false)
    }
  }

  const downloadReport = async (report) => {
    const reportToDownload = report || reportData
    if (!reportToDownload) {
      alert('No report data available. Please generate a report first.')
      return
    }

    // Use the format from reportData or fallback to state variable
    const format = reportToDownload.format || reportFormat
    
    try {
      console.log('Downloading report with format:', format)
      const response = await generateReportAPI({ format })
      console.log('Download response:', response)

      if (!response) {
        throw new Error('Empty response from server')
      }

      if (format === 'json') {
        // Download as JSON file
        const dataStr = JSON.stringify(response, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log('JSON file downloaded successfully')
      } else if (format === 'csv') {
        // For CSV, use the csv_content from response
        const csvContent = response.csv_content
        if (!csvContent) {
          throw new Error('CSV content not found in response')
        }
        const dataBlob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log('CSV file downloaded successfully')
      } else {
        throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert(`Failed to download report: ${error.message}`)
    }
  }

  const convertToCSV = (data) => {
    // Simple CSV conversion - in a real app, you'd want more sophisticated CSV generation
    const rows = []
    rows.push(['Report Type', 'Generated At', 'Date From', 'Date To'])

    if (data) {
      Object.keys(data).forEach(section => {
        rows.push([section.toUpperCase(), '', '', ''])
        // Add section data - simplified for now
        rows.push(['Data', JSON.stringify(data[section]).substring(0, 100) + '...'])
      })
    }

    return rows.map(row => row.join(',')).join('\n')
  }

  const shareReport = async (report) => {
    const reportToShare = report || reportData
    if (!reportToShare) return

    try {
      // Create a shareable summary
      const shareText = `Analytics Report: ${reportToShare.type.toUpperCase()} - Generated on ${reportToShare.generatedAt}

Key Insights:
${getReportSummary(reportToShare)}

Generated by Admin Analytics Dashboard`

      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `Analytics Report: ${reportToShare.type}`,
          text: shareText,
          url: window.location.href
        })
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // Use clipboard if available (HTTPS only)
        await navigator.clipboard.writeText(shareText)
        alert('Report summary copied to clipboard!')
      } else {
        // Fallback: alert the user
        alert('Share functionality not available in this context. Please use the download option instead.')
      }
    } catch (error) {
      console.error('Error sharing report:', error)
      alert('Failed to share report. Please try again.')
    }
  }

  const getReportSummary = (report) => {
    if (!report.content) return 'Report data not available'

    const data = report.content
    let summary = ''

    switch (report.type) {
      case 'summary':
        if (data.executive_summary) {
          const metrics = data.executive_summary.key_metrics
          summary = `- Total Users: ${metrics.total_users.toLocaleString()}
- Total Revenue: $${metrics.total_revenue.toLocaleString()}
- Total Appointments: ${metrics.total_appointments.toLocaleString()}`
        }
        break
      case 'users':
        if (data.user_analytics) {
          const roles = data.user_analytics.demographics.by_role
          summary = `- User Roles: ${Object.entries(roles).map(([role, count]) => `${role}: ${count}`).join(', ')}`
        }
        break
      case 'salons':
        if (data.salon_performance) {
          summary = `- Total Salons: ${data.salon_performance.overview.total_salons}
- Published Salons: ${data.salon_performance.overview.published_salons}`
        }
        break
      case 'revenue':
        if (data.revenue_analysis) {
          summary = `- Total Revenue: $${data.revenue_analysis.summary.total_revenue.toLocaleString()}
- Avg Transaction: $${data.revenue_analysis.summary.avg_transaction_value.toFixed(2)}`
        }
        break
      case 'retention':
        if (data.retention_analysis) {
          summary = `- 30-Day Retention: ${data.retention_analysis.retention_30d}%
- Repeat Customer Rate: ${data.retention_analysis.repeat_customer_rate}%`
        }
        break
      default:
        summary = 'Comprehensive analytics data available in the full report.'
    }

    return summary
  }

  const renderReportContent = () => {
    if (!reportData || !reportData.content) return <p>No report data</p>

    if (reportData.error) {
      return <p className="error-message">{reportData.content}</p>
    }

    const data = reportData.content

    // Handle dashboard_summary type
    if (reportData.type === 'dashboard_summary') {
      return (
        <div className="dashboard-report">
          {data.platform_stats && (
            <div className="report-section">
              <h5>Platform Statistics</h5>
              <ul>
                {Object.entries(data.platform_stats).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? value.toLocaleString() : value}</li>
                ))}
              </ul>
            </div>
          )}

          {data.revenue_metrics && (
            <div className="report-section">
              <h5>Revenue Metrics</h5>
              <ul>
                {Object.entries(data.revenue_metrics).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> ${typeof value === 'number' ? value.toLocaleString() : value}</li>
                ))}
              </ul>
            </div>
          )}

          {data.appointment_trends && (
            <div className="report-section">
              <h5>Appointment Trends</h5>
              <ul>
                {Object.entries(data.appointment_trends).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? value.toLocaleString() : value}</li>
                ))}
              </ul>
            </div>
          )}

          {data.loyalty_program && (
            <div className="report-section">
              <h5>Loyalty Program</h5>
              <ul>
                {Object.entries(data.loyalty_program).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? value.toLocaleString() : value}</li>
                ))}
              </ul>
            </div>
          )}

          {data.pending_actions && (
            <div className="report-section">
              <h5>Pending Actions</h5>
              <ul>
                {Object.entries(data.pending_actions).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? value.toLocaleString() : value}</li>
                ))}
              </ul>
            </div>
          )}

          {data.user_demographics && (
            <div className="report-section">
              <h5>User Demographics</h5>
              <ul>
                {data.user_demographics.by_role && Object.entries(data.user_demographics.by_role).map(([role, count]) => (
                  <li key={role}><strong>{role}:</strong> {count.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}

          {data.retention_metrics && (
            <div className="report-section">
              <h5>Retention Metrics</h5>
              <ul>
                {Object.entries(data.retention_metrics).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? (key.includes('rate') ? value.toFixed(1) + '%' : value.toLocaleString()) : value}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }

    return <p>Unknown report type</p>
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

        {/* Reports Generation - UC 3.10 */}
        <section className="reports-section">
          <h2>Reports & Export</h2>

          <div className="reports-controls">
            <div className="control-group">
              <label>Format:</label>
              <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div className="control-group">
              <button
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={generatingReport}
              >
                {generatingReport ? 'Generating...' : 'Generate Dashboard Report'}
              </button>
            </div>
          </div>

          {reportData && (
            <div className="report-preview">
              <h3>Report Preview</h3>
              <div className="report-meta">
                <span><strong>Type:</strong> Dashboard Summary</span>
                <span><strong>Format:</strong> {reportFormat.toUpperCase()}</span>
                <span><strong>Generated:</strong> {reportData.generatedAt}</span>
              </div>

              <div className="report-content">
                {renderReportContent()}
              </div>

              <div className="report-actions">
                <button
                  className="download-btn"
                  onClick={downloadReport}
                  disabled={!reportData}
                >
                  Download {reportFormat.toUpperCase()}
                </button>
                <button
                  className="share-btn"
                  onClick={shareReport}
                >
                  Share Report
                </button>
              </div>
            </div>
          )}
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