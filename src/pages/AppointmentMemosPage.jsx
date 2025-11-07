import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorAppointments } from '../api/appointments'
import {
  createAppointmentMemo,
  deleteAppointmentMemo,
  getAppointmentMemos,
  updateAppointmentMemo,
} from '../api/memos'
import './appointment-memos.css'

export default function AppointmentMemosPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [memos, setMemos] = useState([])
  const [memoContent, setMemoContent] = useState('')
  const [editingMemoId, setEditingMemoId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await getVendorAppointments()
      // Filter for completed or booked appointments
      const filtered = data.filter(
        (apt) => apt.status === 'completed' || apt.status === 'booked'
      )
      setAppointments(filtered)
      setError('')
    } catch (err) {
      console.error('Error loading appointments:', err)
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentSelect = async (appointment) => {
    try {
      setSelectedAppointment(appointment)
      setLoading(true)
      const memosList = await getAppointmentMemos(appointment.id)
      setMemos(memosList)
      setMemoContent('')
      setEditingMemoId(null)
      setError('')
      setSuccess('')
    } catch (err) {
      console.error('Error loading memos:', err)
      setError('Failed to load memos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMemo = async () => {
    if (!memoContent.trim()) {
      setError('Memo content cannot be empty')
      return
    }

    if (!selectedAppointment) {
      setError('Please select an appointment')
      return
    }

    try {
      setLoading(true)
      if (editingMemoId) {
        await updateAppointmentMemo(editingMemoId, {
          content: memoContent,
        })
        setSuccess('Memo updated successfully')
      } else {
        await createAppointmentMemo(selectedAppointment.id, {
          content: memoContent,
        })
        setSuccess('Memo created successfully')
      }
      await handleAppointmentSelect(selectedAppointment)
      setError('')
    } catch (err) {
      console.error('Error saving memo:', err)
      setError('Failed to save memo')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const handleEditMemo = (memo) => {
    setMemoContent(memo.content)
    setEditingMemoId(memo.id)
    setError('')
    setSuccess('')
  }

  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm('Are you sure you want to delete this memo?')) {
      return
    }

    try {
      setLoading(true)
      await deleteAppointmentMemo(memoId)
      setSuccess('Memo deleted successfully')
      await handleAppointmentSelect(selectedAppointment)
      setError('')
    } catch (err) {
      console.error('Error deleting memo:', err)
      setError('Failed to delete memo')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setMemoContent('')
    setEditingMemoId(null)
    setError('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="appointment-memos-page">
      <div className="memos-container">
        <h1>Appointment Notes</h1>
        <p className="subtitle">
          Send follow-up instructions and notes to your clients
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="content">
          <div className="appointments-section">
            <h2>Your Appointments</h2>
            {loading && !appointments.length ? (
              <p className="loading">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="no-data">No appointments available</p>
            ) : (
              <div className="appointments-list">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`appointment-item ${selectedAppointment?.id === apt.id ? 'selected' : ''
                      }`}
                    onClick={() => handleAppointmentSelect(apt)}
                  >
                    <div className="appointment-header">
                      <span className="appointment-time">
                        {formatDate(apt.starts_at)}
                      </span>
                      <span className={`appointment-status ${apt.status}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <span className="client-name">
                        Client: {apt.client_name || 'Unknown'}
                      </span>
                      <span className="service-name">
                        Service: {apt.service_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedAppointment && (
            <div className="memos-section">
              <h2>Memos for Selected Appointment</h2>

              <div className="memo-form">
                <textarea
                  className="memo-textarea"
                  placeholder="Enter appointment note or follow-up instructions..."
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  disabled={loading}
                />
                <div className="form-actions">
                  <button
                    className="btn-submit"
                    onClick={handleSubmitMemo}
                    disabled={loading || !memoContent.trim()}
                  >
                    {editingMemoId ? 'Update Memo' : 'Add Memo'}
                  </button>
                  {editingMemoId && (
                    <button
                      className="btn-cancel"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {memos.length === 0 ? (
                <p className="no-memos">
                  No memos yet. Add your first note above.
                </p>
              ) : (
                <div className="memos-list">
                  {memos.map((memo) => (
                    <div key={memo.id} className="memo-card">
                      <div className="memo-header">
                        <span className="memo-date">
                          {formatDate(memo.created_at)}
                        </span>
                        <div className="memo-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditMemo(memo)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteMemo(memo.id)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="memo-content">{memo.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
