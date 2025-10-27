import { useState } from 'react'
import './VerificationModal.css'

function VerificationModal({ isOpen, shopName, onClose, onSubmit, isLoading }) {
  const [tin, setTin] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!tin.trim()) {
      setError('TIN (Tax Identification Number) is required')
      return
    }

    if (tin.trim().length < 5) {
      setError('TIN must be at least 5 characters')
      return
    }

    try {
      await onSubmit(tin)
      setTin('')
    } catch (err) {
      setError(err.message || 'Failed to submit for verification')
    }
  }

  const handleClose = () => {
    setTin('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Submit for Verification</h2>
          <button
            type="button"
            className="close-button"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="shop-name">
            <strong>Shop:</strong> {shopName}
          </p>
          <p className="description">
            To verify your salon, please provide your Tax Identification Number (TIN).
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tin">Tax Identification Number (TIN)</label>
              <input
                id="tin"
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="Enter your TIN"
                disabled={isLoading}
                className="tin-input"
              />
              <small className="help-text">
                Your TIN is required by the platform to verify your business legitimacy.
              </small>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VerificationModal
