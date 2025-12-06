import { useEffect, useState } from 'react';
import {
  createPromotion,
  deletePromotion,
  getPromotionAnalytics,
  getPromotionStats,
  getSalonPromotions,
  sendPromotion
} from '../api/promotions';
import { getSalons } from '../api/staff';
import { useAuth } from '../context/AuthContext';
import VendorPortalLayout from '../components/VendorPortalLayout';
import '../pages/promotions.css';

export default function PromotionsPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [promotionStats, setPromotionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    promo_code: '',
    start_date: '',
    end_date: '',
    target_segment: 'all',
    max_uses: -1,
  });

  // Load salons on mount
  useEffect(() => {
    loadSalons();
  }, []);

  // Load promotions when salon is selected
  useEffect(() => {
    if (selectedSalonId) {
      loadPromotions();
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

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await getSalonPromotions(selectedSalonId);
      setPromotions(response);
    } catch (err) {
      setError('Failed to load promotions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getPromotionStats(selectedSalonId);
      setPromotionStats(response);

      // Also load analytics (UC 1.18)
      try {
        const analytics = await getPromotionAnalytics(selectedSalonId);
        setPromotionStats((prev) => ({
          ...prev,
          ...analytics
        }));
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discount_value' || name === 'min_purchase' || name === 'max_uses'
        ? Number(value)
        : value,
    }));
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.discount_value || !formData.end_date) {
      setError('Description, discount value, and end date are required');
      return;
    }

    try {
      setLoading(true);
      
      // Transform form data to match backend API requirements
      let discount_percentage = 0;
      let discount_cents = 0;
      
      if (formData.discount_type === 'percentage') {
        // For percentage: send percentage value and calculated cents
        discount_percentage = formData.discount_value;
        discount_cents = Math.round(formData.discount_value * 100); // Convert to cents representation
      } else {
        // For fixed amount: discount_percentage = 0, discount_cents = amount in cents
        discount_percentage = 0;
        discount_cents = Math.round(formData.discount_value);
      }
      
      const promotionPayload = {
        discount_percentage: discount_percentage,
        discount_cents: discount_cents,
        description: formData.description,
        expires_at: new Date(formData.end_date).toISOString(),
        target_clients: formData.target_segment,
      };

      await createPromotion(selectedSalonId, promotionPayload);

      // Reset form
      setFormData({
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_purchase: 0,
        promo_code: '',
        start_date: '',
        end_date: '',
        target_segment: 'all',
        max_uses: -1,
      });

      setViewMode('list');
      loadPromotions();
      loadStats();
      setError(null);
    } catch (err) {
      setError('Failed to create promotion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPromotion = async (promotionId) => {
    if (!window.confirm('Send this promotion to targeted customers?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await sendPromotion(selectedSalonId, promotionId);
      alert(`Promotion sent to ${result.recipients_count} customers`);
      loadPromotions();
    } catch (err) {
      setError('Failed to send promotion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      setLoading(true);
      await deletePromotion(selectedSalonId, promotionId);
      loadPromotions();
      loadStats();
    } catch (err) {
      setError('Failed to delete promotion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentLabel = (segment) => {
    const labels = {
      all: 'All Customers',
      loyal: 'Loyal Customers (5+)',
      repeat: 'Repeat Customers (2-4)',
      onetime: 'One-Time Customers',
    };
    return labels[segment] || segment;
  };

  const formatDiscount = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% off`;
    } else {
      return `$${(promo.discount_value / 100).toFixed(2)} off`;
    }
  };

  if (loading && !promotions) {
    return (
      <VendorPortalLayout activeKey="marketing">
        <div className="promotions-page">
          <div className="promotions-container"><p>Loading...</p></div>
        </div>
      </VendorPortalLayout>
    );
  }

  return (
    <VendorPortalLayout activeKey="marketing">
      <div className="promotions-page">
        <div className="promotions-container">
          <h1>Promotional Offers</h1>

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
              className={`tab-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Promotions List
            </button>
            <button
              className={`tab-button ${viewMode === 'create' ? 'active' : ''}`}
              onClick={() => setViewMode('create')}
            >
              Create Promotion
            </button>
            {promotionStats && (
              <button
                className={`tab-button ${viewMode === 'stats' ? 'active' : ''}`}
                onClick={() => setViewMode('stats')}
              >
                Statistics
              </button>
            )}
          </div>

          {/* Statistics Tab */}
          {viewMode === 'stats' && promotionStats && (
            <div className="stats-section">
              <h2>Promotion Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Promotions</p>
                  <p className="stat-value">{promotionStats.total_promotions}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Active</p>
                  <p className="stat-value">{promotionStats.active_promotions}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Inactive</p>
                  <p className="stat-value">{promotionStats.inactive_promotions}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Send Campaigns</p>
                  <p className="stat-value">{promotionStats.total_send_campaigns}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Recipients</p>
                  <p className="stat-value">{promotionStats.total_recipients_targeted}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Avg Recipients/Campaign</p>
                  <p className="stat-value">{promotionStats.average_recipients_per_campaign}</p>
                </div>
              </div>

              {/* UC 1.18 Analytics */}
              {promotionStats.open_rate !== undefined && (
                <div className="analytics-section">
                  <h3>Engagement Analytics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <p className="stat-label">Open Rate</p>
                      <p className="stat-value">{(promotionStats.open_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Dismiss Rate</p>
                      <p className="stat-value">{(promotionStats.dismiss_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Total Sent</p>
                      <p className="stat-value">{promotionStats.total_sent || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {promotionStats.promotions_by_segment && Object.keys(promotionStats.promotions_by_segment).length > 0 && (
                <div className="segment-stats">
                  <h3>Promotions by Target Segment</h3>
                  <div className="segment-list">
                    {Object.entries(promotionStats.promotions_by_segment).map(
                      ([segment, count]) => (
                        <div key={segment} className="segment-item">
                          <span className="segment-name">{getSegmentLabel(segment)}</span>
                          <span className="segment-count">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List Tab */}
          {viewMode === 'list' && promotions && (
            <div className="list-section">
              <h2>All Promotions</h2>

              {promotions.promotions && promotions.promotions.length > 0 ? (
                <div className="promotions-list">
                  {promotions.promotions.map((promo) => (
                    <div key={promo.id} className="promotion-card">
                      <div className="promo-header">
                        <h3>{promo.title}</h3>
                        <span className={`status-badge ${promo.status}`}>{promo.status}</span>
                      </div>

                      <p className="promo-description">{promo.description}</p>

                      <div className="promo-details">
                        <div className="detail-item">
                          <span className="label">Discount:</span>
                          <span className="value discount">{formatDiscount(promo)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Code:</span>
                          <span className="value code">{promo.promo_code}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Target:</span>
                          <span className="value">{getSegmentLabel(promo.target_segment)}</span>
                        </div>
                        {promo.min_purchase > 0 && (
                          <div className="detail-item">
                            <span className="label">Min Purchase:</span>
                            <span className="value">${(promo.min_purchase / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {promo.start_date && (
                          <div className="detail-item">
                            <span className="label">Valid:</span>
                            <span className="value">
                              {new Date(promo.start_date).toLocaleDateString()}
                              {promo.end_date && ` - ${new Date(promo.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="promo-actions">
                        <button
                          className="send-btn"
                          onClick={() => handleSendPromotion(promo.id)}
                          disabled={loading}
                        >
                          Send to Customers
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeletePromotion(promo.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No promotions yet. Create one to get started!</p>
              )}
            </div>
          )}

          {/* Create Tab */}
          {viewMode === 'create' && (
            <div className="create-section">
              <h2>Create New Promotion</h2>

              <form onSubmit={handleCreatePromotion} className="promotion-form">
                <div className="form-group">
                  <label htmlFor="title">Promotion Title *</label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Summer Special, Holiday Offer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe the promotion and what customers will get"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount_type">Discount Type</label>
                    <select
                      id="discount_type"
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleFormChange}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_value">Discount Value</label>
                    <input
                      id="discount_value"
                      type="number"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleFormChange}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="promo_code">Promo Code</label>
                  <input
                    id="promo_code"
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleFormChange}
                    placeholder="Auto-generated if blank"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date">Start Date</label>
                    <input
                      id="start_date"
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date">End Date</label>
                    <input
                      id="end_date"
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="target_segment">Target Segment</label>
                  <select
                    id="target_segment"
                    name="target_segment"
                    value={formData.target_segment}
                    onChange={handleFormChange}
                  >
                    <option value="all">All Customers</option>
                    <option value="loyal">Loyal Customers (5+ visits)</option>
                    <option value="repeat">Repeat Customers (2-4 visits)</option>
                    <option value="onetime">One-Time Customers</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="min_purchase">Min Purchase (cents)</label>
                    <input
                      id="min_purchase"
                      type="number"
                      name="min_purchase"
                      value={formData.min_purchase}
                      onChange={handleFormChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_uses">Max Uses (-1 unlimited)</label>
                    <input
                      id="max_uses"
                      type="number"
                      name="max_uses"
                      value={formData.max_uses}
                      onChange={handleFormChange}
                      placeholder="-1"
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Promotion'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </VendorPortalLayout>
  );
}
