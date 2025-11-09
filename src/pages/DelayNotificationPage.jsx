import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSalons } from '../api/staff';
import {
  notifyAppointmentDelay,
  getSalonDelays,
  resolveDelay,
  getDelayAnalytics,
} from '../api/delays';
import '../pages/delay-notifications.css';

export default function DelayNotificationPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [delays, setDelays] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'notify', 'analytics'
  const [selectedDelay, setSelectedDelay] = useState(null);

  // Form state for notification
  const [formData, setFormData] = useState({
    appointment_id: '',
    delay_minutes: '',
    message: '',
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Load salons on mount
  useEffect(() => {
    if (user && user.role === 'vendor') {
      loadSalons();
    }
  }, [user]);

  // Load delays when salon selected or filter changes
  useEffect(() => {
    if (selectedSalonId) {
      loadDelays();
      if (viewMode === 'analytics') {
        loadAnalytics();
      }
    }
  }, [selectedSalonId, filterType, viewMode]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const response = await getSalons();
      if (response && response.salons) {
        setSalons(response.salons);
        if (response.salons.length > 0) {
          setSelectedSalonId(response.salons[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load salons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDelays = async () => {
    try {
      setLoading(true);
      const response = await getSalonDelays(selectedSalonId, filterType);
      if (response) {
        setDelays(response.delays || []);
      }
    } catch (err) {
      setError('Failed to load delays');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getDelayAnalytics(selectedSalonId);
      if (response) {
        setAnalytics(response);
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.appointment_id || !formData.delay_minutes || !formData.message) {
      setError('All fields are required');
      return false;
    }
    if (isNaN(formData.delay_minutes) || formData.delay_minutes <= 0) {
      setError('Delay minutes must be a positive number');
      return false;
    }
    if (formData.message.length < 1 || formData.message.length > 500) {
      setError('Message must be between 1 and 500 characters');
      return false;
    }
    return true;
  };

  const handleNotifyDelay = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await notifyAppointmentDelay(selectedSalonId, {
        appointment_id: parseInt(formData.appointment_id),
        delay_minutes: parseInt(formData.delay_minutes),
        message: formData.message,
      });
      setShowConfirmDialog(false);
      setFormData({
        appointment_id: '',
        delay_minutes: '',
        message: '',
      });
      setError(null);
      loadDelays();
    } catch (err) {
      setError('Failed to send delay notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDelay = async (delayId) => {
    try {
      setLoading(true);
      await resolveDelay(selectedSalonId, delayId);
      setError(null);
      loadDelays();
    } catch (err) {
      setError('Failed to resolve delay');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'vendor') {
    return <div className="error-message">Access denied. Vendor only.</div>;
  }

  return (
    <div className="delays-container">
      <h1>Appointment Delay Notifications</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="salon-selector">
        <label htmlFor="salon-select">Select Salon:</label>
        <select
          id="salon-select"
          value={selectedSalonId || ''}
          onChange={(e) => {
            setSelectedSalonId(parseInt(e.target.value));
            setViewMode('list');
          }}
        >
          <option value="">-- Choose Salon --</option>
          {salons.map((salon) => (
            <option key={salon.id} value={salon.id}>
              {salon.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSalonId && (
        <>
          <div className="view-mode-tabs">
            <button
              className={`tab-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Delay History
            </button>
            <button
              className={`tab-button ${viewMode === 'notify' ? 'active' : ''}`}
              onClick={() => setViewMode('notify')}
            >
              Notify Delay
            </button>
            <button
              className={`tab-button ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
            >
              Analytics
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="list-section">
              <h2>Delay Notifications</h2>

              <div className="filter-controls">
                <label htmlFor="filter-select">Filter:</label>
                <select
                  id="filter-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Delays</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {loading ? (
                <p>Loading delays...</p>
              ) : delays && delays.length > 0 ? (
                <div className="delays-list">
                  {delays.map((delay) => (
                    <div key={delay.id} className="delay-card">
                      <div className="delay-header">
                        <h3>Appointment #{delay.appointment_id}</h3>
                        <span className={`status-badge ${delay.is_resolved ? 'resolved' : 'pending'}`}>
                          {delay.is_resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </div>

                      <div className="delay-details">
                        <div className="detail-item">
                          <span className="label">Client ID:</span>
                          <span className="value">{delay.client_id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Delay Duration:</span>
                          <span className="value delay-duration">{delay.delay_minutes} minutes</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Sent:</span>
                          <span className="value">
                            {new Date(delay.created_at).toLocaleString()}
                          </span>
                        </div>
                        {delay.is_resolved && (
                          <div className="detail-item">
                            <span className="label">Resolved:</span>
                            <span className="value">
                              {new Date(delay.resolved_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="delay-message">
                        <strong>Message:</strong>
                        <p>{delay.message}</p>
                      </div>

                      {!delay.is_resolved && (
                        <div className="delay-actions">
                          <button
                            className="resolve-btn"
                            onClick={() => handleResolveDelay(delay.id)}
                            disabled={loading}
                          >
                            Mark as Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No delay notifications</div>
              )}
            </div>
          )}

          {viewMode === 'notify' && (
            <div className="notify-section">
              <h2>Send Delay Notification</h2>

              <div className="notify-form">
                <div className="form-group">
                  <label htmlFor="appointment-id">Appointment ID *</label>
                  <input
                    id="appointment-id"
                    type="number"
                    name="appointment_id"
                    value={formData.appointment_id}
                    onChange={handleFormChange}
                    placeholder="Enter appointment ID"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="delay-minutes">Delay (minutes) *</label>
                  <input
                    id="delay-minutes"
                    type="number"
                    name="delay_minutes"
                    value={formData.delay_minutes}
                    onChange={handleFormChange}
                    placeholder="Enter delay duration in minutes"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    placeholder="Enter message to client (max 500 characters)"
                    maxLength="500"
                    rows="4"
                  />
                  <small>{formData.message.length}/500 characters</small>
                </div>

                <div className="form-preview">
                  <strong>Preview:</strong>
                  <div className="preview-card">
                    <p>We're currently running {formData.delay_minutes || '?'} minutes late.</p>
                    <p>{formData.message || 'Your message will appear here...'}</p>
                  </div>
                </div>

                <button
                  className="send-notification-btn"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={loading}
                >
                  Send Notification
                </button>
              </div>

              {showConfirmDialog && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Confirm Send</h3>
                    <p>
                      Send delay notification for Appointment #{formData.appointment_id}?
                    </p>
                    <p className="warning">
                      This will notify the client immediately.
                    </p>
                    <div className="modal-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => setShowConfirmDialog(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-confirm"
                        onClick={handleNotifyDelay}
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'analytics' && (
            <div className="analytics-section">
              <h2>Delay Analytics</h2>

              {loading ? (
                <p>Loading analytics...</p>
              ) : analytics ? (
                <>
                  <div className="analytics-grid">
                    <div className="analytics-card">
                      <div className="card-label">Total Delays Sent</div>
                      <div className="card-value">{analytics.total_delays_sent}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Resolved</div>
                      <div className="card-value resolved">{analytics.resolved_delays}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Pending</div>
                      <div className="card-value pending">{analytics.pending_delays}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Total Delay Minutes</div>
                      <div className="card-value">{analytics.total_delay_minutes}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Average Delay</div>
                      <div className="card-value">
                        {analytics.average_delay_minutes} min
                      </div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Clients Notified</div>
                      <div className="card-value">{analytics.clients_notified}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Appointments Affected</div>
                      <div className="card-value">{analytics.appointments_affected}</div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-label">Resolution Rate</div>
                      <div className="card-value">
                        {analytics.total_delays_sent > 0
                          ? Math.round(
                              (analytics.resolved_delays / analytics.total_delays_sent) * 100
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-data">No analytics data available</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
