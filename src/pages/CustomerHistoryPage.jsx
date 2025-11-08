import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSalons } from '../api/staff';
import {
  getSalonCustomers,
  getCustomerVisitHistory,
  getCustomerStatistics,
} from '../api/customers';
import '../pages/customer-history.css';

export default function CustomerHistoryPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'customers', 'detail'

  // Load salons on mount
  useEffect(() => {
    loadSalons();
  }, []);

  // Load customers and stats when salon is selected
  useEffect(() => {
    if (selectedSalonId) {
      loadCustomers();
      loadStats();
    }
  }, [selectedSalonId]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const response = await getSalons();
      setSalons(response.salons || []);
      if (response.salons && response.salons.length > 0) {
        setSelectedSalonId(response.salons[0].id);
      }
    } catch (err) {
      setError('Failed to load salons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await getSalonCustomers(selectedSalonId);
      setCustomers(response);
      setSelectedCustomerId(null);
      setCustomerHistory(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getCustomerStatistics(selectedSalonId);
      setCustomerStats(response);
    } catch (err) {
      setError('Failed to load customer statistics');
      console.error(err);
    }
  };

  const loadCustomerDetail = async (clientId) => {
    try {
      setLoading(true);
      const response = await getCustomerVisitHistory(selectedSalonId, clientId);
      setCustomerHistory(response);
      setSelectedCustomerId(clientId);
      setViewMode('detail');
    } catch (err) {
      setError('Failed to load customer history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const filteredCustomers = customers?.customers?.filter((customer) =>
    customer.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.client_phone && customer.client_phone.includes(searchTerm)) ||
    (customer.client_email && customer.client_email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (loading && !customers) {
    return <div className="customer-history-container"><p>Loading...</p></div>;
  }

  return (
    <div className="customer-history-container">
      <h1>Customer History</h1>

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
              className={`tab-button ${viewMode === 'customers' ? 'active' : ''}`}
              onClick={() => setViewMode('customers')}
            >
              All Customers
            </button>
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && customerStats && (
            <div className="overview-section">
              <h2>Customer Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Unique Customers</p>
                  <p className="stat-value">{customerStats.total_unique_customers}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Visits</p>
                  <p className="stat-value">{customerStats.total_visits}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Repeat Customers</p>
                  <p className="stat-value">
                    {customerStats.repeat_customers} ({customerStats.repeat_customer_percentage}%)
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Loyal Customers (5+)</p>
                  <p className="stat-value">{customerStats.loyal_customers}</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">One-Time Customers</p>
                  <p className="stat-value">{customerStats.one_time_customers}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Avg Visits per Customer</p>
                  <p className="stat-value">{customerStats.average_visits_per_customer}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Revenue</p>
                  <p className="stat-value">{formatCurrency(customerStats.total_revenue_cents)}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Avg Revenue per Visit</p>
                  <p className="stat-value">{formatCurrency(customerStats.average_revenue_per_visit)}</p>
                </div>
              </div>

              <div className="segment-breakdown">
                <h3>Customer Segments</h3>
                <div className="segment-bars">
                  <div className="segment">
                    <div className="segment-label">Loyal (5+ visits)</div>
                    <div className="segment-bar loyal">
                      <div
                        className="segment-fill"
                        style={{
                          width: `${(customerStats.loyal_customers / customerStats.total_unique_customers) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="segment-value">{customerStats.loyal_customers}</div>
                  </div>
                  <div className="segment">
                    <div className="segment-label">Repeat (2-4 visits)</div>
                    <div className="segment-bar repeat">
                      <div
                        className="segment-fill"
                        style={{
                          width: `${
                            ((customerStats.repeat_customers - customerStats.loyal_customers) /
                              customerStats.total_unique_customers) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="segment-value">
                      {customerStats.repeat_customers - customerStats.loyal_customers}
                    </div>
                  </div>
                  <div className="segment">
                    <div className="segment-label">One-Time</div>
                    <div className="segment-bar onetime">
                      <div
                        className="segment-fill"
                        style={{
                          width: `${(customerStats.one_time_customers / customerStats.total_unique_customers) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="segment-value">{customerStats.one_time_customers}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers List Tab */}
          {viewMode === 'customers' && customers && (
            <div className="customers-section">
              <h2>All Customers</h2>
              
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredCustomers.length > 0 ? (
                <div className="customers-table-wrapper">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Visits</th>
                        <th>Total Spent</th>
                        <th>Last Visit</th>
                        <th>Avg Value</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.client_id}>
                          <td>
                            <div className="customer-name-cell">
                              <div className="customer-name">{customer.client_name}</div>
                              {customer.client_phone && (
                                <div className="customer-contact">{customer.client_phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="visit-count">
                            <span className="badge">{customer.visit_count}</span>
                          </td>
                          <td className="amount">{formatCurrency(customer.total_spent_cents)}</td>
                          <td>
                            {customer.last_visit
                              ? new Date(customer.last_visit).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="amount">
                            {formatCurrency(customer.average_visit_value)}
                          </td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => loadCustomerDetail(customer.client_id)}
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No customers found</p>
              )}
            </div>
          )}

          {/* Customer Detail View */}
          {viewMode === 'detail' && customerHistory && (
            <div className="detail-section">
              <button className="back-btn" onClick={() => setViewMode('customers')}>
                ← Back to Customers
              </button>

              <div className="customer-detail-header">
                <h2>{customerHistory.customer.client_name}</h2>
                <div className="customer-info">
                  {customerHistory.customer.client_phone && (
                    <div className="info-item">
                      <span className="label">Phone:</span> {customerHistory.customer.client_phone}
                    </div>
                  )}
                  {customerHistory.customer.client_email && (
                    <div className="info-item">
                      <span className="label">Email:</span> {customerHistory.customer.client_email}
                    </div>
                  )}
                  {customerHistory.customer.join_date && (
                    <div className="info-item">
                      <span className="label">Member Since:</span>{' '}
                      {new Date(customerHistory.customer.join_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="customer-stats">
                <div className="stat-card small">
                  <p className="stat-label">Total Visits</p>
                  <p className="stat-value">{customerHistory.total_visits}</p>
                </div>
                <div className="stat-card small">
                  <p className="stat-label">Completed</p>
                  <p className="stat-value">{customerHistory.completed_visits}</p>
                </div>
                <div className="stat-card small">
                  <p className="stat-label">Total Spent</p>
                  <p className="stat-value">{formatCurrency(customerHistory.total_spent_cents)}</p>
                </div>
                <div className="stat-card small">
                  <p className="stat-label">Avg Per Visit</p>
                  <p className="stat-value">{formatCurrency(customerHistory.average_visit_value)}</p>
                </div>
              </div>

              <div className="visit-history">
                <h3>Visit History</h3>
                {customerHistory.history && customerHistory.history.length > 0 ? (
                  <div className="history-list">
                    {customerHistory.history.map((visit) => (
                      <div key={visit.appointment_id} className={`history-item ${visit.status}`}>
                        <div className="visit-date">
                          {new Date(visit.date).toLocaleDateString()}
                        </div>
                        <div className="visit-service">
                          <strong>{visit.service}</strong>
                        </div>
                        <div className="visit-staff">
                          Staff: <span>{visit.staff}</span>
                        </div>
                        <div className="visit-duration">
                          {visit.duration_minutes} min
                        </div>
                        <div className="visit-amount">{formatCurrency(visit.amount_cents)}</div>
                        <div className={`visit-status ${visit.status}`}>{visit.status}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No visit history</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
