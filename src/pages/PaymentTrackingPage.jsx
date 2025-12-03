import { useEffect, useState } from 'react';
import {
  getSalonPayments,
  getSalonPaymentsByDate,
  getSalonPaymentStats,
} from '../api/payments';
import { getSalons } from '../api/staff';
import { useAuth } from '../context/AuthContext';
import VendorPortalLayout from '../components/VendorPortalLayout';
import '../pages/payment-tracking.css';

export default function PaymentTrackingPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [payments, setPayments] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [datePayments, setDatePayments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'details', 'date'

  // Load salons on mount
  useEffect(() => {
    if (user?.role === 'vendor') {
      loadSalons(user.id);
    } else {
      setSalons([]);
      setSelectedSalonId(null);
    }
  }, [user]);

  // Load payments when salon is selected
  useEffect(() => {
    if (selectedSalonId) {
      loadPayments();
      loadStats();
    }
  }, [selectedSalonId]);

  const loadSalons = async (vendorId) => {
    try {
      setLoading(true);
      const { salons: salonList } = await getSalons(vendorId);
      setSalons(salonList);
      if (salonList.length > 0) {
        const firstSalon = salonList[0];
        setSelectedSalonId(firstSalon.id ?? firstSalon.salon_id ?? null);
      } else {
        setSelectedSalonId(null);
      }
    } catch (err) {
      setError('Failed to load salons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await getSalonPayments(selectedSalonId);
      setPayments(response);
    } catch (err) {
      setError('Failed to load payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getSalonPaymentStats(selectedSalonId);
      setStats(response);
    } catch (err) {
      setError('Failed to load payment stats');
      console.error(err);
    }
  };

  const loadDatePayments = async (date) => {
    try {
      setLoading(true);
      const response = await getSalonPaymentsByDate(selectedSalonId, date);
      setDatePayments(response);
      setViewMode('date');
    } catch (err) {
      setError('Failed to load date payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    loadDatePayments(date);
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading && !payments) {
    return (
      <VendorPortalLayout activeKey="revenue">
        <div className="payment-tracking-page">
          <div className="payment-tracking-container">
            <p>Loading...</p>
          </div>
        </div>
      </VendorPortalLayout>
    );
  }

  return (
    <VendorPortalLayout activeKey="revenue">
      <div className="payment-tracking-page">
        <div className="payment-tracking-container">
          <h1>Payment Tracking</h1>

      {/* Salon Selector */}
      <div className="salon-selector">
        <label htmlFor="salon-select">Select Shop:</label>
        <select
          id="salon-select"
          value={selectedSalonId || ''}
          onChange={(e) => setSelectedSalonId(Number(e.target.value))}
        >
          <option value="">-- Choose a shop --</option>
          {salons.map((salon) => (
            <option key={salon.id} value={salon.id}>
              {salon.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {selectedSalonId && (
        <>
          {/* View Mode Tabs */}
          <div className="view-mode-tabs">
            <button
              className={`tab-button ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${viewMode === 'details' ? 'active' : ''}`}
              onClick={() => setViewMode('details')}
            >
              Payment History
            </button>
            <button
              className={`tab-button ${viewMode === 'date' ? 'active' : ''}`}
              onClick={() => setViewMode('date')}
            >
              By Date
            </button>
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && stats && (
            <div className="overview-section">
              <h2>Revenue Summary</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Revenue</p>
                  <p className="stat-value">
                    {formatCurrency(stats.total_revenue || 0)}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Transactions</p>
                  <p className="stat-value">{stats.transaction_count || 0}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Average Per Transaction</p>
                  <p className="stat-value">
                    {formatCurrency(
                      stats.transaction_count > 0
                        ? Math.round(stats.total_revenue / stats.transaction_count)
                        : 0
                    )}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Period</p>
                  <p className="stat-value">Last 30 Days</p>
                </div>
              </div>

              {/* Revenue by Service */}
              {stats.revenue_by_service && Object.keys(stats.revenue_by_service).length > 0 && (
                <div className="revenue-by-service">
                  <h3>Revenue by Service</h3>
                  <div className="service-list">
                    {Object.entries(stats.revenue_by_service).map(([service, amount]) => (
                      <div key={service} className="service-item">
                        <span className="service-name">{service}</span>
                        <span className="service-revenue">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revenue by Day */}
              {stats.revenue_by_day && Object.keys(stats.revenue_by_day).length > 0 && (
                <div className="revenue-by-day">
                  <h3>Revenue by Day (Last 30 Days)</h3>
                  <div className="day-list">
                    {Object.entries(stats.revenue_by_day)
                      .sort()
                      .reverse()
                      .slice(0, 10)
                      .map(([date, amount]) => (
                        <div key={date} className="day-item">
                          <span className="day-date">{date}</span>
                          <span className="day-revenue">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {viewMode === 'details' && payments && (
            <div className="details-section">
              <h2>Payment History</h2>
              {payments.payments && payments.payments.length > 0 ? (
                <div className="payments-table-wrapper">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>Client</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.payments.map((payment, idx) => (
                        <tr key={idx}>
                          <td>{new Date(payment.date).toLocaleDateString()}</td>
                          <td>{payment.service || 'N/A'}</td>
                          <td>{payment.client || 'N/A'}</td>
                          <td className="amount">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No payments found</p>
              )}
              {payments.total_revenue !== undefined && (
                <div className="total-revenue">
                  <strong>Total Revenue: {formatCurrency(payments.total_revenue)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Date Selection Tab */}
          {viewMode === 'date' && (
            <div className="date-section">
              <div className="date-selector">
                <label htmlFor="date-input">Select Date:</label>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {datePayments && (
                <>
                  {datePayments.payments && datePayments.payments.length > 0 ? (
                    <div className="date-payments">
                      <h3>Payments for {selectedDate}</h3>
                      <div className="payments-table-wrapper">
                        <table className="payments-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Service</th>
                              <th>Client</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datePayments.payments.map((payment, idx) => (
                              <tr key={idx}>
                                <td>
                                  {payment.time || new Date(payment.date).toLocaleTimeString()}
                                </td>
                                <td>{payment.service || 'N/A'}</td>
                                <td>{payment.client || 'N/A'}</td>
                                <td className="amount">{formatCurrency(payment.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {datePayments.total_revenue !== undefined && (
                        <div className="date-total">
                          <strong>
                            Daily Revenue: {formatCurrency(datePayments.total_revenue)}
                          </strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="no-data">No payments on this date</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </VendorPortalLayout>
  );
}
