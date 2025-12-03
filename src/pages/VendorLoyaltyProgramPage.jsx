import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import { useAuth } from '../context/AuthContext'
import { getMyShops } from '../api/shops'
import '../styles/vendor-loyalty-program.css'

const defaultProgram = {
  isActive: true,
  pointsPerDollar: 1,
  welcomeBonus: 0,
  birthdayBonus: 0,
  redemptionThreshold: 100,
  rewardDescription: '',
  terms: '',
  lastUpdated: null,
}

function storageKeyForSalon(salonId) {
  if (
    salonId === null ||
    salonId === undefined ||
    (typeof salonId === 'string' && salonId.trim() === '') ||
    (typeof salonId === 'number' && !Number.isFinite(salonId)) ||
    (typeof salonId !== 'string' && typeof salonId !== 'number')
  ) {
    throw new Error('Invalid salonId provided to storageKeyForSalon')
  }
  return `loyalty_program_${String(salonId)}`
}

function VendorLoyaltyProgramPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [salons, setSalons] = useState([])
  const [selectedSalonId, setSelectedSalonId] = useState(null)
  const [program, setProgram] = useState({ ...defaultProgram })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'vendor') {
      navigate('/')
      return
    }

    const loadSalons = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMyShops(user.id)
        const vendorSalons = response.salons || []
        setSalons(vendorSalons)
        if (vendorSalons.length > 0) {
          const initialId = vendorSalons[0].id ?? vendorSalons[0].salon_id
          setSelectedSalonId(String(initialId))
        }
      } catch (err) {
        console.error('Unable to load salons for loyalty management', err)
        setError('We could not load your salons. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadSalons()
  }, [navigate, user])

  useEffect(() => {
    if (!selectedSalonId) {
      setProgram({ ...defaultProgram })
      return
    }

    try {
      const stored = localStorage.getItem(storageKeyForSalon(selectedSalonId))
      if (stored) {
        const parsed = JSON.parse(stored)
        setProgram({ ...defaultProgram, ...parsed })
      } else {
        setProgram({ ...defaultProgram })
      }
    } catch (err) {
      console.error('Failed to restore loyalty program from storage', err)
      setProgram(defaultProgram)
    }
  }, [selectedSalonId])

  const selectedSalon = useMemo(() => {
    const targetId = String(selectedSalonId)
    return salons.find((salon) => String(salon.id ?? salon.salon_id) === targetId) || null
  }, [salons, selectedSalonId])

  const handleFieldChange = (field, value) => {
    setProgram((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!selectedSalonId) {
      setStatusMessage('Select a salon before saving.')
      return
    }

    setSaving(true)
    setStatusMessage(null)

    try {
      const payload = {
        ...program,
        pointsPerDollar: Math.max(0, Number(program.pointsPerDollar) || 0),
        welcomeBonus: Math.max(0, Number(program.welcomeBonus) || 0),
        birthdayBonus: Math.max(0, Number(program.birthdayBonus) || 0),
        redemptionThreshold: Math.max(0, Number(program.redemptionThreshold) || 0),
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem(storageKeyForSalon(selectedSalonId), JSON.stringify(payload))
      setProgram(payload)
      setStatusMessage('Loyalty program saved locally. Remember to sync with the backend once available.')
    } catch (err) {
      console.error('Failed to persist loyalty program settings', err)
      setStatusMessage('We could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!user || loading) {
    return (
      <VendorPortalLayout activeKey="marketing">
        <VendorLoadingState message={loading ? 'Loading salons…' : 'Redirecting…'} />
      </VendorPortalLayout>
    )
  }

  if (error) {
    return (
      <VendorPortalLayout activeKey="marketing">
        <div className="vendor-loyalty-program-page">
          <div className="loyalty-program-container">
            <div className="error-card">
              <p>{error}</p>
              <button type="button" className="primary-button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </VendorPortalLayout>
    )
  }

  if (salons.length === 0) {
    return (
      <VendorPortalLayout activeKey="marketing">
        <div className="vendor-loyalty-program-page">
          <div className="loyalty-program-container">
            <div className="empty-state">
              <h1>No salons found</h1>
              <p>You need at least one salon to configure a loyalty program.</p>
              <button type="button" className="primary-button" onClick={() => navigate('/shops/new')}>
                Create a Salon
              </button>
            </div>
          </div>
        </div>
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="marketing">
      <div className="vendor-loyalty-program-page">
        <div className="loyalty-program-container">
          <header className="page-header" aria-label="Salon loyalty program overview">
            <h1>Salon Loyalty Program</h1>
            <p className="subtitle">
              Configure how clients earn and redeem points at your salon. Changes are stored locally until the API supports loyalty updates.
            </p>
          </header>

          <section className="salon-selector" aria-label="Select salon">
            <label htmlFor="salon-select">Salon</label>
            <select
              id="salon-select"
              value={selectedSalonId || ''}
              onChange={(event) => setSelectedSalonId(event.target.value)}
            >
              {salons.map((salon) => {
                const id = String(salon.id ?? salon.salon_id)
                return (
                  <option key={id} value={id}>
                    {salon.name || salon.salon_name || `Salon ${id}`}
                  </option>
                )
              })}
            </select>
          </section>

          <form className="loyalty-form" onSubmit={handleSave}>
            <section className="form-section" aria-label="Program basics">
              <div className="field-group toggle">
                <label htmlFor="program-active">Program Status</label>
                <div className="toggle-row">
                  <input
                    id="program-active"
                    type="checkbox"
                    checked={program.isActive}
                    onChange={(event) => handleFieldChange('isActive', event.target.checked)}
                  />
                  <span>{program.isActive ? 'Active' : 'Paused'}</span>
                </div>
                <p className="field-hint">Disable to pause point accrual without deleting your settings.</p>
              </div>

              <div className="field-group">
                <label htmlFor="points-per-dollar">Points per Dollar</label>
                <input
                  id="points-per-dollar"
                  type="number"
                  min="0"
                  step="1"
                  value={program.pointsPerDollar}
                  onChange={(event) => handleFieldChange('pointsPerDollar', event.target.value)}
                />
                <p className="field-hint">How many points clients earn for each dollar spent.</p>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label htmlFor="welcome-bonus">Welcome Bonus</label>
                  <input
                    id="welcome-bonus"
                    type="number"
                    min="0"
                    step="1"
                    value={program.welcomeBonus}
                    onChange={(event) => handleFieldChange('welcomeBonus', event.target.value)}
                  />
                  <p className="field-hint">Optional one-time bonus when clients join the program.</p>
                </div>

                <div className="field-group">
                  <label htmlFor="birthday-bonus">Birthday Bonus</label>
                  <input
                    id="birthday-bonus"
                    type="number"
                    min="0"
                    step="1"
                    value={program.birthdayBonus}
                    onChange={(event) => handleFieldChange('birthdayBonus', event.target.value)}
                  />
                  <p className="field-hint">Reward returning clients on their birthday month.</p>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="redemption-threshold">Redemption Threshold</label>
                <input
                  id="redemption-threshold"
                  type="number"
                  min="0"
                  step="10"
                  value={program.redemptionThreshold}
                  onChange={(event) => handleFieldChange('redemptionThreshold', event.target.value)}
                />
                <p className="field-hint">Minimum points required before clients can redeem rewards.</p>
              </div>
            </section>

            <section className="form-section" aria-label="Reward experience">
              <div className="field-group">
                <label htmlFor="reward-description">Reward Description</label>
                <textarea
                  id="reward-description"
                  rows="4"
                  value={program.rewardDescription}
                  onChange={(event) => handleFieldChange('rewardDescription', event.target.value)}
                  placeholder="Describe how points can be redeemed (e.g., 100 points = $10 off)."
                />
              </div>

              <div className="field-group">
                <label htmlFor="terms">Program Terms</label>
                <textarea
                  id="terms"
                  rows="3"
                  value={program.terms}
                  onChange={(event) => handleFieldChange('terms', event.target.value)}
                  placeholder="Add any important conditions or expiration rules for your loyalty members."
                />
              </div>
            </section>

            <footer className="form-footer">
              {statusMessage && <p className="status-message">{statusMessage}</p>}
              <div className="footer-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setProgram({ ...defaultProgram })}
                >
                  Reset
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
              <p className="save-hint">
                These settings are stored in your browser for now. Share them with your backend team to persist the program server-side.
              </p>
              {program.lastUpdated && (
                <p className="last-updated">Last updated: {new Date(program.lastUpdated).toLocaleString()}</p>
              )}
            </footer>
          </form>

          {selectedSalon && (
            <section className="preview-card" aria-label="Program preview">
              <h2>Client Preview</h2>
              <div className="preview-body">
                <h3>{selectedSalon.name || selectedSalon.salon_name}</h3>
                <p className="preview-status">Program is {program.isActive ? 'Active' : 'Paused'}</p>
                <ul className="preview-list">
                  <li>{program.pointsPerDollar} point(s) earned per dollar spent</li>
                  {Number(program.welcomeBonus) > 0 && <li>Welcome bonus: {program.welcomeBonus} points</li>}
                  {Number(program.birthdayBonus) > 0 && <li>Birthday bonus: {program.birthdayBonus} points</li>}
                  <li>Redemption threshold: {program.redemptionThreshold} points</li>
                </ul>
                {program.rewardDescription && (
                  <div className="preview-block">
                    <h4>Rewards</h4>
                    <p>{program.rewardDescription}</p>
                  </div>
                )}
                {program.terms && (
                  <div className="preview-block">
                    <h4>Program Terms</h4>
                    <p>{program.terms}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </VendorPortalLayout>
  )
}

export default VendorLoyaltyProgramPage
