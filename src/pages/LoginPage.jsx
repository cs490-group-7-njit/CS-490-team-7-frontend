import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import loginBackground from '../assets/login-bg.jpg'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: null })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: null })

    try {
      await login({ email: form.email, password: form.password })
      navigate('/dashboard')
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
          <div className="login-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              fill="none"
            >
              <path
                d="M14.5 23.5 6 32a4 4 0 0 0 0 5.66L10.34 42a4 4 0 0 0 5.66 0l8.55-8.55"
                stroke="#0f766e"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m33.5 17.5 8.5-8.5a4 4 0 0 0-5.66-5.66l-8.55 8.55"
                stroke="#0f766e"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 34 28.5 19.5a5 5 0 0 1 7.07 0L40 24M20 40l14.5-14.5"
                stroke="#0f766e"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2>I&rsquo;m a Vendor</h2>
          <p>
            List your salon, showcase your work, and connect with new clients.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="input-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="Email Address"
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
              {status.loading ? 'Logging In…' : 'Log In'}
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
