import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import '../styles/profile-edit.css'

function ProfileEditPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    setFormData({
      name: user.name || '',
      phone: user.phone || '',
    })
  }, [user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (!passwordData.new_password) {
      setError('Please enter a new password')
      setLoading(false)
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_password: passwordData.new_password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update password')
      }

      setSuccess('Password updated successfully!')
      setPasswordData({ new_password: '', confirm_password: '' })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating password:', err)
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="page profile-edit-page">
      <Header />
      <main className="profile-container">
        <div className="profile-header">
          <h1>Edit Profile</h1>
          <p className="subtitle">Update your account information</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Profile Information Form */}
        <section className="profile-section">
          <div className="section-title">
            <h2>Profile Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="email">Email (Read-only)</label>
              <input type="email" id="email" value={user.email || ''} disabled className="form-input" />
              <p className="form-hint">Email cannot be changed</p>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="(123) 456-7890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <input
                type="text"
                id="role"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                disabled
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Change Password Form */}
        <section className="profile-section">
          <div className="section-title">
            <h2>Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="new-password">New Password *</label>
              <input
                type="password"
                id="new-password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Enter new password"
                minLength="6"
              />
              <p className="form-hint">Minimum 6 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password *</label>
              <input
                type="password"
                id="confirm-password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Re-enter your password"
                minLength="6"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Account Actions */}
        <section className="profile-section danger-zone">
          <div className="section-title">
            <h2>Account Actions</h2>
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            ← Back to Dashboard
          </button>
        </section>
      </main>
    </div>
  )
}

export default ProfileEditPage
