import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMyShops } from '../api/shops'
import { getSalonAppointments, updateAppointmentStatus } from '../api/vendorAppointments'
import { getStaffBySalon } from '../api/staff'
import VendorLoadingState from '../components/VendorLoadingState'
import VendorPortalLayout from '../components/VendorPortalLayout'
import { useAuth } from '../context/AuthContext'
import './vendor-appointments.css'

function VendorAppointmentsPage() {
  const { user, refreshActivity } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStaffFromUrl = useMemo(() => searchParams.get('staffId'), [searchParams])

  // Data state
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [staffMembers, setStaffMembers] = useState([])

  // Filter state
  const [statusFilter, setStatusFilter] = useState('booked')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffFromUrl)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [isStaffLoading, setIsStaffLoading] = useState(false)

  // Refresh activity on mount
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load shops on mount
  useEffect(() => {
    if (user?.id) {
      loadShops()
    }
  }, [user])

  // Load appointments when shop or filters change
  useEffect(() => {
    if (selectedShop) {
      loadAppointments()
    }
  }, [selectedShop, statusFilter, dateFilter])

  // Load staff list whenever shop changes
  useEffect(() => {
    if (selectedShop) {
      loadStaffMembers(selectedShop)
    } else {
      setStaffMembers([])
      setSelectedStaffId(null)
    }
  }, [selectedShop])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        // Auto-select first shop if available
        if (response.salons.length > 0) {
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load salons')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointments = async () => {
    if (!selectedShop) return

    try {
      setIsLoading(true)
      setError(null)
      const salonId = selectedShop.id ?? selectedShop.salon_id
      const data = await getSalonAppointments(
        salonId,
        statusFilter || undefined,
        dateFilter || undefined
      )
      setAppointments(data)
    } catch (err) {
      setError(err.message || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStaffMembers = async (shop) => {
    try {
      setIsStaffLoading(true)
      const salonId = shop.id ?? shop.salon_id
      const staffList = await getStaffBySalon(salonId)
      setStaffMembers(staffList)

      if (staffList.length === 0) {
        setSelectedStaffId(null)
        return
      }

      // Try to preserve staff selection from URL or previous state
      const normalizedTarget = initialStaffFromUrl || selectedStaffId
      if (normalizedTarget) {
        const valid = staffList.some(
          (member) => String(member.id ?? member.staff_id) === String(normalizedTarget)
        )
        if (valid) {
          setSelectedStaffId(String(normalizedTarget))
          return
        }
      }

      // Default to "All staff" when previous selection is not available
      setSelectedStaffId(null)
    } catch (err) {
      console.error('Failed to load staff list:', err)
      setError(err.message || 'Failed to load staff members')
    } finally {
      setIsStaffLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (!newStatus) return

    console.log('Changing appointment', appointmentId, 'to status:', newStatus)

    try {
      setUpdatingId(appointmentId)
      await updateAppointmentStatus(appointmentId, newStatus)
      setSuccessMessage(`Appointment marked as ${newStatus}`)

      // Reload appointments
      setTimeout(() => {
        loadAppointments()
        setSuccessMessage('')
      }, 1500)
    } catch (err) {
      console.error('Error updating appointment:', err)
      setError(err.message || 'Failed to update appointment')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`
  }

  const getAvailableStatusTransitions = (currentStatus) => {
    const transitions = {
      booked: ['completed', 'no-show', 'cancelled'],
      completed: [],
      cancelled: [],
      'no-show': [],
    }
    return transitions[currentStatus] || []
  }

  const statuses = ['booked', 'completed', 'cancelled', 'no-show']

  const displayedAppointments = useMemo(() => {
    if (!selectedStaffId) return appointments
    return appointments.filter((appt) => {
      const staffIdentifier = appt.staff?.id ?? appt.staff?.staff_id ?? appt.staff_id
      return String(staffIdentifier) === String(selectedStaffId)
    })
  }, [appointments, selectedStaffId])

  const activeStaffMember = useMemo(() => {
    if (!selectedStaffId) return null
    return staffMembers.find(
      (member) => String(member.id ?? member.staff_id) === String(selectedStaffId)
    )
  }, [staffMembers, selectedStaffId])

  const handleStaffSelection = (value) => {
    const nextValue = value === '' ? null : value
    setSelectedStaffId(nextValue)

    const params = new URLSearchParams(searchParams)
    if (nextValue) {
      params.set('staffId', nextValue)
    } else {
      params.delete('staffId')
    }
    setSearchParams(params)
  }

  if (isLoading && shops.length === 0) {
    return (
      <VendorPortalLayout activeKey="appointments">
        <VendorLoadingState message="Loading your appointments..." />
      </VendorPortalLayout>
    )
  }

  return (
    <VendorPortalLayout activeKey="appointments">
      <div className="vendor-appointments-page">
        <div className="appointments-container">
          <h1>Manage Appointments</h1>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {shops.length === 0 ? (
            <div className="no-salons">
              <p>You don't have any salons yet. Create a salon to manage appointments.</p>
            </div>
          ) : (
            <>
              {/* Salon Selector */}
              <div className="controls-section">
                <div className="form-group">
                  <label htmlFor="salon-select">Select Salon:</label>
                  <select
                    id="salon-select"
                    value={selectedShop ? String(selectedShop.id ?? selectedShop.salon_id) : ''}
                    onChange={(e) => {
                      const shop = shops.find((s) => String(s.id ?? s.salon_id) === e.target.value)
                      setSelectedShop(shop || null)
                    }}
                  >
                    {shops.map(shop => (
                      <option key={shop.id ?? shop.salon_id} value={shop.id ?? shop.salon_id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="form-group">
                  <label htmlFor="status-filter">Filter by Status:</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="form-group">
                  <label htmlFor="date-filter">Filter by Date:</label>
                  <input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="staff-view-panel">
                <div className="staff-view-header">
                  <h2>Staff Schedule View</h2>
                  <p>Select a team member to focus this page on their appointments. Share the link so they can check their schedule directly.</p>
                </div>

                <div className="staff-view-controls">
                  <div className="form-group">
                    <label htmlFor="staff-filter">Select Team Member:</label>
                    <select
                      id="staff-filter"
                      value={selectedStaffId ?? ''}
                      onChange={(e) => handleStaffSelection(e.target.value)}
                      disabled={isStaffLoading || staffMembers.length === 0}
                    >
                      <option value="">All Staff</option>
                      {staffMembers.map((staff) => {
                        const memberId = staff.id ?? staff.staff_id
                        const memberName = staff.user?.name || staff.title || `Staff #${memberId}`
                        return (
                          <option key={memberId} value={memberId}>
                            {memberName}
                          </option>
                        )
                      })}
                    </select>
                    {isStaffLoading && <small>Loading team members…</small>}
                    {!isStaffLoading && staffMembers.length === 0 && (
                      <small>No staff found for this salon yet.</small>
                    )}
                  </div>

                  {selectedStaffId && (
                    <div className="staff-view-buttons">
                      <button
                        type="button"
                        onClick={() => handleStaffSelection('')}
                        className="staff-link-btn secondary"
                      >
                        Reset to all staff
                      </button>
                    </div>
                  )}
                </div>

                {activeStaffMember && (
                  <div className="staff-summary">
                    <strong>Viewing schedule for:</strong>{' '}
                    {activeStaffMember.user?.name || activeStaffMember.title || 'Selected staff'}
                    <span className="staff-total">Upcoming appointments: {displayedAppointments.length}</span>
                  </div>
                )}
              </div>

              {/* Appointments List */}
              {isLoading && shops.length > 0 && (
                <VendorLoadingState message="Updating appointments..." compact />
              )}

              {!isLoading && displayedAppointments.length === 0 ? (
                <div className="no-appointments">
                  <p>No appointments found with the selected filters.</p>
                </div>
              ) : (!isLoading && (
                <div className="appointments-list">
                  <div className="appointments-header">
                    <span className="col-time">Time</span>
                    <span className="col-client">Client</span>
                    <span className="col-service">Service</span>
                    <span className="col-staff">Staff</span>
                    <span className="col-status">Status</span>
                    <span className="col-actions">Actions</span>
                  </div>

                  {displayedAppointments.map(appt => {
                    const nextStatuses = getAvailableStatusTransitions(appt.status)
                    console.log('Appointment:', appt.id, 'Status:', appt.status, 'Next statuses:', nextStatuses, 'Full appt:', appt)

                    return (
                      <div key={appt.id} className="appointment-row">
                        <span className="col-time">{formatDateTime(appt.starts_at)}</span>
                        <span className="col-client">{appt.client?.name || 'Unknown'}</span>
                        <span className="col-service">
                          {appt.service?.name}
                          <span className="duration">({appt.service?.duration_minutes}min)</span>
                        </span>
                        <span className="col-staff">{appt.staff?.user?.name || 'Unknown'}</span>
                        <span className="col-status">
                          <span className={getStatusBadgeClass(appt.status)}>
                            {appt.status.toUpperCase()}
                          </span>
                        </span>
                        <span className="col-actions">
                          {nextStatuses.length > 0 && updatingId !== appt.id ? (
                            <div className="status-actions">
                              {nextStatuses.map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={(e) => {
                                    console.log('Button clicked!', status, appt.id)
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleStatusChange(appt.id, status)
                                  }}
                                  className={`status-btn status-btn-${status}`}
                                  title={`Mark as ${status}`}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                          ) : updatingId === appt.id ? (
                            <span className="updating">Updating...</span>
                          ) : (
                            <span className="no-actions">—</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </VendorPortalLayout>
  )
}

export default VendorAppointmentsPage
