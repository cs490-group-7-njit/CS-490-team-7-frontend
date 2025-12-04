import { useEffect, useState } from 'react'
import { getMessages, markMessageAsRead, sendMessage } from '../api/messages'
import { listAppointments } from '../api/appointments'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './messages.css'

function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    recipient_id: '',
    salon_id: '',
    subject: '',
    body: '',
  })
  const [sending, setSending] = useState(false)
  const [appointmentReminderMessage, setAppointmentReminderMessage] = useState(null)

  useEffect(() => {
    fetchMessages()
    checkForAppointmentReminder()
  }, [])

  const isAppointmentDayAway = (startsAt) => {
    const now = new Date()
    const appointmentDate = new Date(startsAt)
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const apptDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
    
    return apptDateOnly.getTime() === tomorrow.getTime()
  }

  const checkForAppointmentReminder = async () => {
    try {
      const appointments = await listAppointments()
      const appointmentsDayAway = appointments.filter(
        (apt) => apt.status === 'booked' && isAppointmentDayAway(apt.starts_at)
      )
      
      if (appointmentsDayAway.length > 0) {
        const appointmentTime = new Date(appointmentsDayAway[0].starts_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        
        const reminderMessage = {
          message_id: 'system-reminder',
          sender_id: 0,
          recipient_id: user.user_id,
          subject: '🔔 Appointment Reminder',
          body: `You have ${appointmentsDayAway.length} appointment${appointmentsDayAway.length > 1 ? 's' : ''} scheduled for tomorrow at ${appointmentTime}. Make sure to arrive on time!`,
          created_at: new Date().toISOString(),
          is_read: false,
          is_system: true,
        }
        setAppointmentReminderMessage(reminderMessage)
      }
    } catch (err) {
      console.error('Error checking for appointment reminder:', err)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await getMessages(user.user_id, { page: 1, limit: 50 })
      setMessages(data.messages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    try {
      setSending(true)
      const messageData = {
        sender_id: user.user_id,
        ...composeData,
      }
      await sendMessage(messageData)
      setShowCompose(false)
      setComposeData({ recipient_id: '', salon_id: '', subject: '', body: '' })
      await fetchMessages() // Refresh messages
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId)
      setMessages(prev =>
        prev.map(msg =>
          msg.message_id === messageId
            ? { ...msg, is_read: true }
            : msg
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMessageDirection = (message) => {
    return message.sender_id === user.user_id ? 'sent' : 'received'
  }

  if (loading) {
    return (
      <div className="page messages-page">
        <Header />
        <div className="page-content">
          <h1>Messages</h1>
          <div className="loading">Loading messages...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page messages-page">
        <Header />
        <div className="page-content">
          <h1>Messages</h1>
          <div className="error">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page messages-page">
      <Header />
      <div className="page-content">
        <div className="messages-header">
          <h1>Messages</h1>
          <button
            type="button"
            className="compose-btn"
            onClick={() => setShowCompose(true)}
          >
            Compose Message
          </button>
        </div>

        {showCompose && (
          <div className="compose-modal">
            <div className="compose-content">
              <h2>Compose Message</h2>
              <form onSubmit={handleSendMessage}>
                <div className="form-group">
                  <label htmlFor="recipient_id">Recipient ID:</label>
                  <input
                    type="number"
                    id="recipient_id"
                    value={composeData.recipient_id}
                    onChange={(e) => setComposeData(prev => ({ ...prev, recipient_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon_id">Salon ID (optional):</label>
                  <input
                    type="number"
                    id="salon_id"
                    value={composeData.salon_id}
                    onChange={(e) => setComposeData(prev => ({ ...prev, salon_id: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input
                    type="text"
                    id="subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="body">Message:</label>
                  <textarea
                    id="body"
                    value={composeData.body}
                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                    rows={6}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowCompose(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="messages-list">
          {appointmentReminderMessage && (
            <div
              key="system-reminder"
              className="message-item received system-message unread"
            >
              <div className="message-header">
                <div className="message-meta">
                  <span className="message-direction">System</span>
                  <span className="message-participant">SalonHub</span>
                </div>
                <span className="message-date">
                  {formatDate(appointmentReminderMessage.created_at)}
                </span>
              </div>
              <div className="message-content">
                <h3 className="message-subject">{appointmentReminderMessage.subject}</h3>
                <p className="message-body">{appointmentReminderMessage.body}</p>
              </div>
            </div>
          )}
          {messages.length === 0 && !appointmentReminderMessage ? (
            <div className="no-messages">
              <p>No messages found.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.message_id}
                className={`message-item ${getMessageDirection(message)} ${!message.is_read ? 'unread' : ''}`}
              >
                <div className="message-header">
                  <div className="message-meta">
                    <span className="message-direction">
                      {getMessageDirection(message) === 'sent' ? 'To:' : 'From:'}
                    </span>
                    <span className="message-participant">
                      {getMessageDirection(message) === 'sent'
                        ? `User ${message.recipient_id}`
                        : `User ${message.sender_id}`
                      }
                    </span>
                    {message.salon_id && (
                      <span className="message-salon">(Salon {message.salon_id})</span>
                    )}
                  </div>
                  <span className="message-date">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <div className="message-content">
                  <h3 className="message-subject">{message.subject}</h3>
                  <p className="message-body">{message.body}</p>
                </div>
                {getMessageDirection(message) === 'received' && !message.is_read && (
                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={() => handleMarkAsRead(message.message_id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesPage