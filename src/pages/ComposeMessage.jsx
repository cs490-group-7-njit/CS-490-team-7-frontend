import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { sendMessage } from '../api/messages'
import { getVendorInfo } from '../api/users'
import './messages.css'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

function ComposeMessage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const query = useQuery()
  const vendorIdFromQuery = query.get('vendorId')

  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(!!vendorIdFromQuery)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorIdFromQuery) return
      setLoading(true)
      try {
        const res = await getVendorInfo(vendorIdFromQuery)
        // assume backend returns { user_id, name, email }
        setVendor(res)
      } catch (err) {
        setError(err.message || 'Failed to load vendor info')
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [vendorIdFromQuery])

  const validate = () => {
    if (!subject || subject.trim().length === 0) return 'Subject is required.'
    if (!body || body.trim().length === 0) return 'Message body is required.'
    if (!vendor) return 'Recipient vendor not set.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSending(true)
      const messageData = {
        sender_id: user.user_id,
        recipient_id: vendor.user_id,
        salon_id: null,
        subject: subject.trim(),
        body: body.trim(),
      }
      await sendMessage(messageData)
      navigate('/messages')
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page messages-page">
      <Header />
      <div className="page-content">
        <div className="messages-header">
          <h1>Compose Message</h1>
        </div>

        {loading ? (
          <div className="loading">Loading recipient...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <div className="compose-container">
            <form onSubmit={handleSubmit} className="compose-form">
              <div className="form-group">
                <label>To:</label>
                {vendor ? (
                  <div className="recipient-display">
                    {vendor.name} ({vendor.email})
                  </div>
                ) : (
                  <div className="recipient-display">No recipient selected</div>
                )}
              </div>

              <div style={{ display: 'none' }}>
                {/* Hidden recipient id used for API */}
                <input type="hidden" name="recipient_id" value={vendor?.user_id || ''} />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject:</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="body">Message:</label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => navigate('/messages')}>
                  Cancel
                </button>
                <button type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComposeMessage
