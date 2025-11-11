import { useEffect, useState } from 'react';
import {
  addSocialMediaLink,
  deleteSocialMediaLink,
  getAllSalonSocialMedia,
  updateSocialMediaLink,
} from '../api/social-media';
import { getSalons } from '../api/staff';
import { useAuth } from '../context/AuthContext';
import '../pages/social-media.css';

export default function SocialMediaPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'add'
  const [editingLink, setEditingLink] = useState(null);

  const platformIcons = {
    instagram: '📷',
    facebook: '👨‍💼',
    twitter: '🐦',
    tiktok: '🎵',
    youtube: '📺',
    linkedin: '💼',
    pinterest: '📌',
    snapchat: '👻',
    telegram: '✈️',
    whatsapp: '💬',
  };

  const platformLabels = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    pinterest: 'Pinterest',
    snapchat: 'Snapchat',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
  };

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    display_name: '',
    is_visible: true,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load salons on mount
  useEffect(() => {
    if (user && user.role === 'vendor') {
      loadSalons();
    }
  }, [user]);

  // Load social media links when salon selected
  useEffect(() => {
    if (selectedSalonId) {
      loadSocialLinks();
    }
  }, [selectedSalonId]);

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

  const loadSocialLinks = async () => {
    try {
      setLoading(true);
      const response = await getAllSalonSocialMedia(selectedSalonId);
      if (response) {
        setSocialLinks(response.social_media || []);
      }
    } catch (err) {
      setError('Failed to load social media links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.platform || !formData.url) {
      setError('Platform and URL are required');
      return false;
    }
    if (formData.url.length < 5 || formData.url.length > 500) {
      setError('URL must be between 5 and 500 characters');
      return false;
    }
    // Check if platform already exists (when adding new)
    if (!editingLink && socialLinks.some((link) => link.platform === formData.platform)) {
      setError(`${formData.platform} link already exists`);
      return false;
    }
    return true;
  };

  const handleAddLink = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const linkData = {
        platform: formData.platform,
        url: formData.url,
        display_name: formData.display_name || formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1),
        is_visible: formData.is_visible,
      };

      if (editingLink) {
        await updateSocialMediaLink(selectedSalonId, editingLink.id, linkData);
      } else {
        await addSocialMediaLink(selectedSalonId, linkData);
      }

      setFormData({
        platform: '',
        url: '',
        display_name: '',
        is_visible: true,
      });
      setEditingLink(null);
      setViewMode('list');
      setError(null);
      loadSocialLinks();
    } catch (err) {
      setError(editingLink ? 'Failed to update link' : 'Failed to add link');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLink = (link) => {
    setFormData({
      platform: link.platform,
      url: link.url,
      display_name: link.display_name,
      is_visible: link.is_visible,
    });
    setEditingLink(link);
    setViewMode('add');
  };

  const handleDeleteLink = async (linkId) => {
    try {
      setLoading(true);
      await deleteSocialMediaLink(selectedSalonId, linkId);
      setError(null);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      loadSocialLinks();
    } catch (err) {
      setError('Failed to delete link');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (link) => {
    try {
      setLoading(true);
      await updateSocialMediaLink(selectedSalonId, link.id, {
        is_visible: !link.is_visible,
      });
      setError(null);
      loadSocialLinks();
    } catch (err) {
      setError('Failed to update visibility');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'vendor') {
    return <div className="error-message">Access denied. Vendor only.</div>;
  }

  return (
    <div className="social-media-container">
      <h1>Social Media Links</h1>

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
              My Links
            </button>
            <button
              className={`tab-button ${viewMode === 'add' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('add');
                if (!editingLink) {
                  setFormData({
                    platform: '',
                    url: '',
                    display_name: '',
                    is_visible: true,
                  });
                }
              }}
            >
              {editingLink ? 'Edit Link' : 'Add Link'}
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="list-section">
              <h2>Social Media Links</h2>

              {loading ? (
                <p>Loading links...</p>
              ) : socialLinks.length > 0 ? (
                <div className="social-links-grid">
                  {socialLinks.map((link) => (
                    <div key={link.id} className={`social-link-card ${link.is_visible ? 'visible' : 'hidden'}`}>
                      <div className="link-header">
                        <div className="platform-info">
                          <span className="platform-icon">{platformIcons[link.platform] || '🔗'}</span>
                          <div>
                            <h3>{platformLabels[link.platform] || link.platform}</h3>
                            <p className="display-name">{link.display_name}</p>
                          </div>
                        </div>
                        <span className={`visibility-badge ${link.is_visible ? 'visible' : 'hidden'}`}>
                          {link.is_visible ? '👁️ Visible' : '🚫 Hidden'}
                        </span>
                      </div>

                      <div className="link-url">
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.url}
                        </a>
                      </div>

                      <div className="link-actions">
                        <button
                          className="toggle-visibility-btn"
                          onClick={() => handleToggleVisibility(link)}
                          title={link.is_visible ? 'Hide link' : 'Show link'}
                        >
                          {link.is_visible ? '🙈 Hide' : '👁️ Show'}
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleEditLink(link)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => {
                            setDeleteTarget(link.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No social media links added yet.</p>
                  <p>Click "Add Link" to get started!</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'add' && (
            <div className="add-section">
              <h2>{editingLink ? 'Edit Social Media Link' : 'Add Social Media Link'}</h2>

              <div className="form-card">
                <div className="form-group">
                  <label htmlFor="platform">Platform *</label>
                  <select
                    id="platform"
                    name="platform"
                    value={formData.platform}
                    onChange={handleFormChange}
                    disabled={!!editingLink}
                  >
                    <option value="">-- Select Platform --</option>
                    <option value="instagram">📷 Instagram</option>
                    <option value="facebook">👨‍💼 Facebook</option>
                    <option value="twitter">🐦 Twitter</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="youtube">📺 YouTube</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="pinterest">📌 Pinterest</option>
                    <option value="snapchat">👻 Snapchat</option>
                    <option value="telegram">✈️ Telegram</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="url">URL *</label>
                  <input
                    id="url"
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="display_name">Display Name</label>
                  <input
                    id="display_name"
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleFormChange}
                    placeholder="e.g., My Instagram"
                  />
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="is_visible"
                      checked={formData.is_visible}
                      onChange={handleFormChange}
                    />
                    Make this link visible to clients
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setViewMode('list');
                      setEditingLink(null);
                      setFormData({
                        platform: '',
                        url: '',
                        display_name: '',
                        is_visible: true,
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-submit"
                    onClick={handleAddLink}
                    disabled={loading}
                  >
                    {loading ? (editingLink ? 'Updating...' : 'Adding...') : editingLink ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showDeleteDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Social Media Link?</h3>
            <p>Are you sure you want to delete this social media link?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => handleDeleteLink(deleteTarget)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
