import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import loginBackground from '../assets/login-bg.jpg'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [activeTab, setActiveTab] = useState('client')
  const [status, setStatus] = useState({ loading: false, error: null })

  const tabs = {
    client: {
      title: 'Client',
      defaultCredentials: { email: 'client@example.com', password: 'password' },
      welcomeTitle: 'Welcome Back, Client',
      welcomeMessage: 'Sign in to book appointments and manage your beauty services',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="18" r="6" stroke="#0f766e" strokeWidth="2.5" fill="none"/>
          <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    },
    vendor: {
      title: 'Vendor',
      defaultCredentials: { email: 'vicky.vendor@example.com', password: 'password' },
      welcomeTitle: 'Welcome Back, Partner',
      welcomeMessage: 'Access your salon dashboard to manage services and appointments',
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
      defaultCredentials: { email: 'admin@example.com', password: 'password' },
      welcomeTitle: 'Admin Portal',
      welcomeMessage: 'Sign in to manage the platform and oversee operations',
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
  const [form, setForm] = useState({ email: '', password: '' })

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    // Clear form when switching tabs
    setForm({ email: '', password: '' })
    setStatus({ loading: false, error: null })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: null })

    try {
      const result = await login({ email: form.email, password: form.password })
      
      // Validate that the user's actual role matches the selected login type
      const userRole = result.user?.role || 'client'
      
      if (userRole !== activeTab) {
        setStatus({ 
          loading: false, 
          error: `Invalid login type. This account is registered as a ${userRole}, but you selected ${activeTab} login.` 
        })
        return
      }
      
      // Navigate based on validated user role
      switch (userRole) {
        case 'client':
          navigate('/dashboard') // Could be '/client-dashboard' in the future
          break
        case 'vendor':
          navigate('/dashboard')
          break
        case 'admin':
          navigate('/dashboard') // Could be '/admin-dashboard' in the future
          break
        default:
          navigate('/dashboard')
      }
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Login failed' })
    }
  }

  return (
    <div
      className="page login-page"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="login-overlay" />

      <Header showSearch={false} showSignupLink />

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

          {/* Login Content */}
          <div className="login-icon" aria-hidden="true">
            {currentTab.icon}
          </div>
          <h2>{currentTab.welcomeTitle}</h2>
          <p>{currentTab.welcomeMessage}</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="input-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />

            <label className="input-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
            />

            {status.error && <p className="form-error">{status.error}</p>}

            <button
              type="submit"
              className="button login-submit"
              disabled={status.loading}
            >
              {status.loading ? 'Logging In…' : `Log In as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </form>

          <p className="signup-meta">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="signup-link-inline">
              Create one here
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
