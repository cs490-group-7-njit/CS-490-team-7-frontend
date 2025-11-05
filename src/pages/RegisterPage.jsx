import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import loginBackground from '../assets/login-bg.jpg'

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [activeTab, setActiveTab] = useState('client')
  const [status, setStatus] = useState({ loading: false, error: null })

  const tabs = {
    client: {
      title: 'Client',
      welcomeTitle: 'Join as a Client',
      welcomeMessage: 'Create your account to book appointments and discover beauty services',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="18" r="6" stroke="#0f766e" strokeWidth="2.5" fill="none"/>
          <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    },
    vendor: {
      title: 'Vendor',
      welcomeTitle: 'Partner with Us',
      welcomeMessage: 'Register your salon and start managing services and appointments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
          <path d="M10 18h28v18H10z" stroke="#0f766e" strokeWidth="2.5" fill="none"/>
          <path d="M6 18l4-8h28l4 8" stroke="#0f766e" strokeWidth="2.5" fill="none"/>
          <path d="M18 26h12" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    },
    admin: {
      title: 'Admin',
      welcomeTitle: 'Admin Registration',
      welcomeMessage: 'Create an admin account to manage the platform',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
          <rect x="12" y="12" width="24" height="24" rx="3" stroke="#0f766e" strokeWidth="2.5" fill="none"/>
          <path d="M18 20h12M18 24h12M18 28h8" stroke="#0f766e" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="32" cy="16" r="4" stroke="#0f766e" strokeWidth="2.2" fill="none"/>
        </svg>
      )
    }
  }

  const currentTab = tabs[activeTab]
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phone: '' 
  })

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setStatus({ loading: false, error: null })
    setForm({ name: '', email: '', password: '', confirmPassword: '', phone: '' })
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Name is required'
    }
    if (!form.email.trim()) {
      return 'Email is required'
    }
    if (!form.email.includes('@')) {
      return 'Please enter a valid email address'
    }
    if (!form.password) {
      return 'Password is required'
    }
    if (form.password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setStatus({ loading: false, error: validationError })
      return
    }

    setStatus({ loading: true, error: null })

    try {
      const userData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: activeTab,
        phone: form.phone || null
      }

      await register(userData)
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration failed:', error)
      setStatus({ 
        loading: false, 
        error: error.message || 'Registration failed. Please try again.' 
      })
    }
  }

  return (
    <div
      className="page login-page"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="login-overlay" />

      <Header showSearch={false} showSignupLink={false} />

      <main className="login-content">
        <section className="login-card">
          {/* Tab Navigation */}
          <div className="login-tabs">
            {Object.entries(tabs).map(([key, tab]) => (
              <button
                key={key}
                type="button"
                className={`tab-button ${activeTab === key ? 'active' : ''}`}
                onClick={() => handleTabChange(key)}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Register Content */}
          <div className="login-icon" aria-hidden="true">
            {currentTab.icon}
          </div>
          <h2>{currentTab.welcomeTitle}</h2>
          <p>{currentTab.welcomeMessage}</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="input-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={status.loading}
              required
            />

            <label className="input-label" htmlFor="register-email">
              Email Address
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={status.loading}
              required
            />

            <label className="input-label" htmlFor="register-phone">
              Phone Number (Optional)
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              disabled={status.loading}
            />

            <label className="input-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={status.loading}
              required
            />

            <label className="input-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={status.loading}
              required
            />

            {status.error && <p className="form-error">{status.error}</p>}

            <button 
              type="submit" 
              className="button login-submit"
              disabled={status.loading}
            >
              {status.loading ? 'Creating Account...' : `Create ${currentTab.title} Account`}
            </button>
          </form>

          <p className="signup-meta">
            Already have an account?{' '}
            <button 
              type="button" 
              className="signup-link-inline"
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Sign in here
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

export default RegisterPage