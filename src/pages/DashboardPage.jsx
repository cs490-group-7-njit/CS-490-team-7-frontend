import { useMemo } from 'react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './dashboard.css'

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

function DashboardPage() {
  const { user } = useAuth()

  const greeting = useMemo(() => {
    const name = user?.name || 'Vendor'
    const firstName = name.split(' ')[0]
    return `Welcome to your Dashboard, ${firstName}`
  }, [user])

  return (
    <div className="page dashboard-page">
      <Header />
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav aria-label="Dashboard navigation">
            {[
              'Dashboard',
              'Appointments',
              'My Shops',
              'Services',
              'Staff',
              'Reviews',
              'Revenue',
              'Marketing',
              'Shop',
            ].map((item) => (
              <button key={item} type="button" className="sidebar-item">
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main">
          <h1>{greeting}</h1>

          <section className="dashboard-summary" aria-label="Salon overview">
            <div className="summary-card">
              <p className="summary-title">Salon Status</p>
              <p className="summary-status">
                <span className="status-dot" aria-hidden="true" /> Verified
              </p>
              <button type="button" className="pill-button">
                Manage Verification
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

          <section className="dashboard-bottom">
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
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
