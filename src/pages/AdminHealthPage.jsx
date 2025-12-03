import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { get } from '../api/http'
import './admin-health.css'

function AdminHealthPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [platformHealth, setPlatformHealth] = useState(null)
  const [uptimeHistory, setUptimeHistory] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setLoading(true)
      
      const [healthRes, uptimeRes, alertsRes] = await Promise.allSettled([
        get('/admin/health/platform'),
        get('/admin/health/uptime'),
        get('/admin/health/alerts')
      ])

      if (healthRes.status === 'fulfilled') {
        setPlatformHealth(healthRes.value)
      }
      if (uptimeRes.status === 'fulfilled') {
        setUptimeHistory(uptimeRes.value)
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value)
      }
    } catch (error) {
      console.error('Error fetching health data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#28a745'
      case 'degraded':
        return '#ffc107'
      case 'critical':
        return '#dc3545'
      case 'operational':
        return '#28a745'
      default:
        return '#6c757d'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return '✓'
      case 'degraded':
        return '⚠'
      case 'critical':
        return '✕'
      default:
        return '•'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#dc3545'
      case 'warning':
        return '#ffc107'
      case 'info':
        return '#17a2b8'
      default:
        return '#6c757d'
    }
  }

  if (loading) {
    return (
      <div className="page admin-health-page">
        <Header />
        <div className="health-container">
          <div className="loading">Loading platform health data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page admin-health-page">
      <Header />
      <main className="health-container">
        <div className="health-header">
          <h1>Platform Health Monitor</h1>
          <p className="subtitle">Real-time monitoring of system uptime, errors, and performance</p>
          <div className="refresh-controls">
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))}>
              <option value={10000}>Refresh: 10s</option>
              <option value={30000}>Refresh: 30s</option>
              <option value={60000}>Refresh: 1m</option>
              <option value={300000}>Refresh: 5m</option>
            </select>
            <button onClick={fetchHealthData} className="refresh-btn">Refresh Now</button>
          </div>
        </div>

        {/* Overall Status */}
        {platformHealth && (
          <section className="status-section">
            <div className="overall-status">
              <div className="status-card main">
                <div className="status-icon" style={{ color: getStatusColor(platformHealth.health_status.status) }}>
                  {getStatusIcon(platformHealth.health_status.status)}
                </div>
                <div className="status-content">
                  <h2>{platformHealth.health_status.status.toUpperCase()}</h2>
                  <p>System Status</p>
                </div>
              </div>

              <div className="status-cards-grid">
                <div className="status-card">
                  <div className="status-icon" style={{ color: getStatusColor(platformHealth.database_health.status) }}>
                    {getStatusIcon(platformHealth.database_health.status)}
                  </div>
                  <div className="status-content">
                    <h3>Database</h3>
                    <p>{platformHealth.database_health.status}</p>
                    <small>{platformHealth.database_health.response_time_ms}ms</small>
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-icon">📊</div>
                  <div className="status-content">
                    <h3>Uptime</h3>
                    <p>{platformHealth.uptime.uptime_percentage}%</p>
                    <small>{platformHealth.uptime.days_since_last_incident} days incident-free</small>
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-icon">⚡</div>
                  <div className="status-content">
                    <h3>API Performance</h3>
                    <p>{platformHealth.api_metrics.avg_response_time_ms}ms</p>
                    <small>{platformHealth.api_metrics.estimated_error_rate}% error rate</small>
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-icon">👥</div>
                  <div className="status-content">
                    <h3>Active Sessions</h3>
                    <p>{platformHealth.sessions.concurrent_sessions_estimate}</p>
                    <small>{platformHealth.sessions.active_users_24h} users, {platformHealth.sessions.active_staff_24h} staff</small>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Performance Metrics */}
        {platformHealth && (
          <section className="metrics-section">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Database Query Performance</h3>
                <div className="metric-value">{platformHealth.performance.db_query_time_ms}ms</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${(platformHealth.performance.db_query_time_ms / 500) * 100}%` }}></div>
                </div>
                <small>Average query time</small>
              </div>

              <div className="metric-card">
                <h3>Cache Hit Rate</h3>
                <div className="metric-value">{platformHealth.performance.cache_hit_rate}%</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${platformHealth.performance.cache_hit_rate}%` }}></div>
                </div>
                <small>Cache effectiveness</small>
              </div>

              <div className="metric-card">
                <h3>Load Capacity</h3>
                <div className="metric-value">{platformHealth.performance.peak_load_capacity_percent}%</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${platformHealth.performance.peak_load_capacity_percent}%` }}></div>
                </div>
                <small>Current load</small>
              </div>

              <div className="metric-card">
                <h3>Memory Usage</h3>
                <div className="metric-value">{platformHealth.performance.memory_usage_percent}%</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${platformHealth.performance.memory_usage_percent}%` }}></div>
                </div>
                <small>System memory</small>
              </div>
            </div>
          </section>
        )}

        {/* Data Integrity */}
        {platformHealth && (
          <section className="integrity-section">
            <h2>Data Integrity</h2>
            <div className="integrity-grid">
              <div className="integrity-card">
                <h3>Total Users</h3>
                <p className="integrity-value">{platformHealth.data_integrity.total_users.toLocaleString()}</p>
              </div>
              <div className="integrity-card">
                <h3>Total Salons</h3>
                <p className="integrity-value">{platformHealth.data_integrity.total_salons.toLocaleString()}</p>
              </div>
              <div className="integrity-card">
                <h3>Total Appointments</h3>
                <p className="integrity-value">{platformHealth.data_integrity.total_appointments.toLocaleString()}</p>
              </div>
              <div className="integrity-card">
                <h3>Consistency Status</h3>
                <p className="integrity-value" style={{ color: '#28a745' }}>
                  ✓ {platformHealth.data_integrity.data_consistency}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Dependencies */}
        {platformHealth && (
          <section className="dependencies-section">
            <h2>External Dependencies</h2>
            <div className="dependencies-grid">
              {Object.entries(platformHealth.dependencies).map(([name, status]) => (
                <div key={name} className="dependency-card">
                  <div className="dependency-status" style={{ color: getStatusColor(status) }}>
                    {getStatusIcon(status)}
                  </div>
                  <h3>{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
                  <p>{status}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Uptime History */}
        {uptimeHistory && (
          <section className="uptime-section">
            <h2>Uptime History (Last 30 Days)</h2>
            <div className="uptime-stats">
              <div className="stat">
                <span className="label">Average Uptime</span>
                <span className="value">{uptimeHistory.statistics.average_uptime}%</span>
              </div>
              <div className="stat">
                <span className="label">Total Downtime</span>
                <span className="value">{uptimeHistory.statistics.total_downtime_minutes}min</span>
              </div>
              <div className="stat">
                <span className="label">Incidents</span>
                <span className="value">{uptimeHistory.statistics.total_incidents}</span>
              </div>
              <div className="stat">
                <span className="label">MTTR</span>
                <span className="value">{uptimeHistory.statistics.mean_time_to_recovery_minutes}min</span>
              </div>
            </div>

            <div className="uptime-chart">
              <h3>Daily Uptime</h3>
              <div className="uptime-days">
                {uptimeHistory.uptime_history.map((day, idx) => (
                  <div key={idx} className="uptime-day" title={`${day.date}: ${day.uptime_percentage}%`}>
                    <div
                      className="uptime-bar"
                      style={{
                        backgroundColor: day.uptime_percentage >= 99.9 ? '#28a745' : day.uptime_percentage >= 99 ? '#ffc107' : '#dc3545',
                        height: `${(day.uptime_percentage / 100) * 100}%`
                      }}
                    ></div>
                    <small>{day.uptime_percentage}%</small>
                  </div>
                ))}
              </div>
            </div>

            {uptimeHistory.incidents.length > 0 && (
              <div className="incidents-list">
                <h3>Recent Incidents</h3>
                {uptimeHistory.incidents.map((incident) => (
                  <div key={incident.id} className="incident-item">
                    <div className="incident-badge" style={{ backgroundColor: incident.severity === 'critical' ? '#dc3545' : '#ffc107' }}>
                      {incident.severity.toUpperCase()}
                    </div>
                    <div className="incident-details">
                      <h4>{incident.type.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p>
                        {incident.date} • Duration: {incident.duration_minutes}min • 
                        Affected: {incident.affected_users} users • {incident.resolution}
                      </p>
                    </div>
                    <div className="incident-status">✓ {incident.status}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Active Alerts */}
        {alerts && (
          <section className="alerts-section">
            <h2>Health Alerts</h2>
            <div className="alerts-summary">
              <div className="alert-stat critical">
                <span className="count">{alerts.critical_count}</span>
                <span className="label">Critical</span>
              </div>
              <div className="alert-stat warning">
                <span className="count">{alerts.warning_count}</span>
                <span className="label">Warnings</span>
              </div>
              <div className="alert-stat info">
                <span className="count">{alerts.active_alerts.length}</span>
                <span className="label">Active</span>
              </div>
            </div>

            <div className="alerts-list">
              {alerts.active_alerts.length > 0 ? (
                alerts.active_alerts.map((alert) => (
                  <div key={alert.id} className="alert-item" style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
                    <div className="alert-severity" style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                      {alert.severity.toUpperCase().charAt(0)}
                    </div>
                    <div className="alert-content">
                      <h4>{alert.type.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p>{alert.message}</p>
                      <small>{new Date(alert.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <p>✓ No active alerts. System is operating normally.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Error Logs */}
        {platformHealth && platformHealth.error_logs.total_errors_24h > 0 && (
          <section className="error-logs-section">
            <h2>Error Logs (Last 24 Hours)</h2>
            <div className="error-stats">
              <div className="error-stat">
                <span className="label">Total Errors</span>
                <span className="value">{platformHealth.error_logs.total_errors_24h}</span>
              </div>
              <div className="error-stat">
                <span className="label">Critical</span>
                <span className="value">{platformHealth.error_logs.critical_errors}</span>
              </div>
              <div className="error-stat">
                <span className="label">Warnings</span>
                <span className="value">{platformHealth.error_logs.warning_errors}</span>
              </div>
              <div className="error-stat">
                <span className="label">Trend</span>
                <span className="value">{platformHealth.error_logs.error_rate_trending}</span>
              </div>
            </div>
            {platformHealth.error_logs.recent_errors.length > 0 && (
              <div className="error-list">
                {platformHealth.error_logs.recent_errors.map((error, idx) => (
                  <div key={idx} className="error-item">
                    <span className="error-type">{error.error_type}</span>
                    <span className="error-time">{new Date(error.timestamp).toLocaleString()}</span>
                    <span className="error-status">✓ {error.resolved ? 'Resolved' : 'Active'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminHealthPage
