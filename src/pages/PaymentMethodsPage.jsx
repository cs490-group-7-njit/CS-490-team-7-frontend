import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from '../api/payments';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './payment-methods.css';

export default function PaymentMethodsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    card_holder_name: '',
    card_number: '',
    card_brand: 'Visa',
    expiry_month: '',
    expiry_year: new Date().getFullYear(),
    cvv: '',
  });

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await getPaymentMethods(user.user_id);
      setPaymentMethods(data.payment_methods || []);
    } catch (err) {
      setError('Failed to load payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.card_holder_name || !formData.card_number || !formData.expiry_month) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await addPaymentMethod(user.user_id, {
        card_holder_name: formData.card_holder_name,
        card_number: formData.card_number,
        card_brand: formData.card_brand,
        expiry_month: parseInt(formData.expiry_month),
        expiry_year: parseInt(formData.expiry_year),
      });

      setSuccess('Payment method added successfully!');
      setFormData({
        card_holder_name: '',
        card_number: '',
        card_brand: 'Visa',
        expiry_month: '',
        expiry_year: new Date().getFullYear(),
        cvv: '',
      });
      setShowForm(false);

      // Reload payment methods
      await loadPaymentMethods();
    } catch (err) {
      setError(err.message || 'Failed to add payment method');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setLoading(true);
      await deletePaymentMethod(user.user_id, paymentMethodId);
      setSuccess('Payment method deleted');
      await loadPaymentMethods();
    } catch (err) {
      setError(err.message || 'Failed to delete payment method');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setLoading(true);
      await setDefaultPaymentMethod(user.user_id, paymentMethodId);
      await loadPaymentMethods();
    } catch (err) {
      setError(err.message || 'Failed to set default payment method');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    setFormData(prev => ({
      ...prev,
      card_number: formatCardNumber(value),
    }));
  };

  const handleCVVChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setFormData(prev => ({
      ...prev,
      cvv: value,
    }));
  };

  const cardBrands = ['Visa', 'Mastercard', 'American Express'];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div className="payment-methods-page">
      <Header />
      <div className="payment-container">
        <div className="payment-header">
          <h1>Payment Methods</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            {showForm ? '✕ Cancel' : '+ Add Payment Method'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {showForm && (
          <form className="payment-form" onSubmit={handleAddPaymentMethod}>
            <div className="form-section">
              <h2>Add New Payment Method</h2>

              <div className="form-group">
                <label htmlFor="card_holder_name">Cardholder Name *</label>
                <input
                  type="text"
                  id="card_holder_name"
                  name="card_holder_name"
                  placeholder="John Doe"
                  value={formData.card_holder_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="card_brand">Card Type *</label>
                <select
                  id="card_brand"
                  name="card_brand"
                  value={formData.card_brand}
                  onChange={handleInputChange}
                >
                  {cardBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="card_number">Card Number *</label>
                <input
                  type="text"
                  id="card_number"
                  name="card_number"
                  placeholder="1234 5678 9012 3456"
                  value={formData.card_number}
                  onChange={handleCardNumberChange}
                  maxLength="19"
                  required
                />
                <small className="form-hint">Enter a fake 16-digit card number</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiry_month">Month *</label>
                  <select
                    id="expiry_month"
                    name="expiry_month"
                    value={formData.expiry_month}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map(month => (
                      <option key={month} value={month}>
                        {String(month).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="expiry_year">Year *</label>
                  <select
                    id="expiry_year"
                    name="expiry_year"
                    value={formData.expiry_year}
                    onChange={handleInputChange}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={handleCVVChange}
                    maxLength="4"
                  />
                  <small className="form-hint">3-4 digits on back of card</small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Payment Method'}
              </button>
            </div>
          </form>
        )}

        {loading && !showForm && <div className="loading-spinner"></div>}

        {paymentMethods.length === 0 && !showForm && !loading && (
          <div className="empty-state">
            <p>No payment methods added yet</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Add Your First Payment Method
            </button>
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div className="payment-methods-list">
            <h2>Your Payment Methods</h2>
            {paymentMethods.map(method => (
              <div key={method.id} className="payment-card">
                <div className="card-info">
                  <div className="card-header">
                    <span className="card-brand">{method.card_brand}</span>
                    {method.is_default && <span className="badge-default">Default</span>}
                  </div>
                  <p className="card-number">•••• •••• •••• {method.card_number_last_four}</p>
                  <p className="card-holder">{method.card_holder_name}</p>
                  <p className="card-expiry">
                    Expires: {String(method.expiry_month).padStart(2, '0')}/{method.expiry_year}
                  </p>
                </div>

                <div className="card-actions">
                  {!method.is_default && (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={loading}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="info-section">
          <h3>ℹ️ Demo Information</h3>
          <p>This is a demonstration of payment method management. Use any fake card numbers below:</p>
          <ul>
            <li><strong>Visa:</strong> 4532 1234 5678 9010</li>
            <li><strong>Mastercard:</strong> 5425 2334 3010 9903</li>
            <li><strong>American Express:</strong> 3782 822463 10005</li>
          </ul>
          <p><strong>Note:</strong> No actual payment processing occurs in this demo.</p>
        </div>
      </div>
    </div>
  );
}
