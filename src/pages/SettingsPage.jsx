import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="page settings-page">
      <Header />
      <main className="settings-container">
        <div className="settings-header">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Settings</h1>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings-group">
              <label>Email Notifications</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="settings-group">
              <label>SMS Notifications</label>
              <input type="checkbox" />
            </div>
            <div className="settings-group">
              <label>Marketing Emails</label>
              <input type="checkbox" />
            </div>
          </section>

          <section className="settings-section">
            <h2>Privacy</h2>
            <div className="settings-group">
              <label>Profile Visibility</label>
              <select>
                <option>Private</option>
                <option>Public</option>
                <option>Friends Only</option>
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h2>Preferences</h2>
            <div className="settings-group">
              <label>Theme</label>
              <select>
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>
            <div className="settings-group">
              <label>Language</label>
              <select>
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </section>

          <button type="button" className="pill-button" style={{ marginTop: '20px' }}>
            Save Settings
          </button>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
