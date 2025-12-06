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
    const value = typeof cents === 'number' ? cents : Number(cents ?? 0);
    if (!Number.isFinite(value)) {
      return '$0.00';
    }
    return `$${(value / 100).toFixed(2)}`;
  };

  const totalRevenueCents = Number(stats?.total_revenue_cents ?? stats?.total_revenue ?? 0);
  const transactionCount = Number(stats?.total_completed ?? stats?.transaction_count ?? 0);
  const averageTransactionCents = transactionCount
    ? Number(stats?.average_transaction_cents ?? Math.round(totalRevenueCents / transactionCount))
    : 0;

  const revenueByServiceEntries = stats?.revenue_by_service
    ? Object.entries(stats.revenue_by_service).map(([serviceName, value]) => {
        const cents =
          typeof value === 'number'
            ? Number(value)
            : Number(value?.revenue_cents ?? value?.revenue ?? 0);
        const count =
          typeof value === 'object' && value !== null
            ? Number(value.count ?? value.total_count ?? value.quantity ?? 0)
            : undefined;
        return [serviceName, cents, count];
      })
    : [];

  const revenueByDayEntries = stats?.revenue_by_day
    ? Object.entries(stats.revenue_by_day).map(([dateKey, cents]) => [dateKey, Number(cents ?? 0)])
    : [];

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
                    {formatCurrency(totalRevenueCents)}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Transactions</p>
                  <p className="stat-value">{transactionCount}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Average Per Transaction</p>
                  <p className="stat-value">
                    {formatCurrency(averageTransactionCents)}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Period</p>
                  <p className="stat-value">Last 30 Days</p>
                </div>
              </div>

              {/* Revenue by Service */}
              {revenueByServiceEntries.length > 0 && (
                <div className="revenue-by-service">
                  <h3>Revenue by Service</h3>
                  <div className="service-list">
                    {revenueByServiceEntries.map(([serviceName, cents, count]) => (
                      <div key={serviceName} className="service-item">
                        <span className="service-name">
                          {serviceName}
                          {count ? ` (${count})` : ''}
                        </span>
                        <span className="service-revenue">{formatCurrency(cents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revenue by Day */}
              {revenueByDayEntries.length > 0 && (
                <div className="revenue-by-day">
                  <h3>Revenue by Day (Last 30 Days)</h3>
                  <div className="day-list">
                    {revenueByDayEntries
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .reverse()
                      .slice(0, 10)
                      .map(([dateKey, cents]) => (
                        <div key={dateKey} className="day-item">
                          <span className="day-date">{dateKey}</span>
                          <span className="day-revenue">{formatCurrency(cents)}</span>
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
                      {payments.payments.map((payment, idx) => {
                        const paymentDate = payment.date || payment.created_at;
                        const amountCents = payment.amount_cents ?? payment.amount;
                        return (
                          <tr key={idx}>
                            <td>
                              {paymentDate
                                ? new Date(paymentDate).toLocaleDateString()
                                : '—'}
                            </td>
                            <td>{payment.service_name ?? payment.service ?? 'N/A'}</td>
                            <td>{payment.client_name ?? payment.client ?? 'N/A'}</td>
                            <td className="amount">{formatCurrency(amountCents)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No payments found</p>
              )}
              {typeof payments.total_revenue_cents !== 'undefined' || typeof payments.total_revenue !== 'undefined' ? (
                <div className="total-revenue">
                  <strong>
                    Total Revenue:{' '}
                    {formatCurrency(
                      payments.total_revenue_cents ?? payments.total_revenue ?? 0
                    )}
                  </strong>
                </div>
              ) : null}
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
                            {datePayments.payments.map((payment, idx) => {
                              const amountCents = payment.amount_cents ?? payment.amount;
                              const timeValue = payment.time || payment.date;
                              return (
                                <tr key={idx}>
                                  <td>
                                    {timeValue
                                      ? new Date(timeValue).toLocaleTimeString()
                                      : '—'}
                                  </td>
                                  <td>{payment.service_name ?? payment.service ?? 'N/A'}</td>
                                  <td>{payment.client_name ?? payment.client ?? 'N/A'}</td>
                                  <td className="amount">{formatCurrency(amountCents)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {(typeof datePayments.daily_total_cents !== 'undefined' ||
                        typeof datePayments.total_revenue_cents !== 'undefined' ||
                        typeof datePayments.total_revenue !== 'undefined') && (
                        <div className="date-total">
                          <strong>
                            Daily Revenue:{' '}
                            {formatCurrency(
                              datePayments.daily_total_cents ??
                                datePayments.total_revenue_cents ??
                                datePayments.total_revenue ??
                                0
                            )}
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
