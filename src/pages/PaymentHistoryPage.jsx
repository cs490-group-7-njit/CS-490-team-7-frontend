import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions } from '../api/payments';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './payment-history.css';

export default function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (user) {
      loadTransactions(1);
    }
  }, [user]);

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await getTransactions(user.user_id, page, 10);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load payment history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    loadTransactions(page);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-refunded';
      default:
        return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏱';
      case 'failed':
        return '✕';
      case 'refunded':
        return '↶';
      default:
        return '•';
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = filterStatus
    ? transactions.filter(t => t.status === filterStatus)
    : transactions;

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount_dollars, 0);

  return (
    <div className="payment-history-page">
      <Header />
      <div className="history-container">
        <div className="history-header">
          <h1>Payment History</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/profile/edit')}
          >
            ← Back to Profile
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Spent</h3>
            <p className="amount">${totalAmount.toFixed(2)}</p>
            <span className="card-label">Across all transactions</span>
          </div>
          <div className="summary-card">
            <h3>Total Transactions</h3>
            <p className="count">{pagination.total}</p>
            <span className="card-label">Completed payments</span>
          </div>
          <div className="summary-card">
            <h3>Average Transaction</h3>
            <p className="amount">
              ${pagination.total > 0 ? (totalAmount / pagination.total).toFixed(2) : '0.00'}
            </p>
            <span className="card-label">Per appointment</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No payment history found</p>
            <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Appointment</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} className="transaction-row">
                    <td className="date-cell">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="amount-cell">
                      <strong>${transaction.amount_dollars.toFixed(2)}</strong>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)} {transaction.status}
                      </span>
                    </td>
                    <td className="appointment-cell">
                      <button
                        className="link-button"
                        onClick={() => navigate(`/appointments/${transaction.appointment_id}`)}
                      >
                        Appointment #{transaction.appointment_id}
                      </button>
                    </td>
                    <td className="payment-method-cell">
                      {transaction.payment_method_id ? (
                        <span>Card ending in {transaction.payment_method_id}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              ← Previous
            </button>

            <div className="page-info">
              Page {pagination.page} of {pagination.pages}
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || loading}
            >
              Next →
            </button>
          </div>
        )}

        <div className="info-section">
          <h3>💳 Transaction Information</h3>
          <p>
            This page displays your payment history for all appointments. Each transaction
            is linked to an appointment you booked through SalonHub.
          </p>
          <ul>
            <li><strong>Completed:</strong> Payment successful and processed</li>
            <li><strong>Pending:</strong> Payment is being processed</li>
            <li><strong>Failed:</strong> Payment encountered an error</li>
            <li><strong>Refunded:</strong> Payment was refunded</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
