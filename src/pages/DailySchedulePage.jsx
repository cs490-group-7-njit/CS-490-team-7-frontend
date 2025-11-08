import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyShops } from '../api/salons'
import {
  getStaffDailySchedule,
  getStaffWeeklySchedule,
} from '../api/schedule'
import { getStaffBySalon } from '../api/staff'
import './daily-schedule.css'

export default function DailySchedulePage() {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [viewMode, setViewMode] = useState('daily') // 'daily' or 'weekly'
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadShops()
  }, [])

  const loadShops = async () => {
    try {
      setLoading(true)
      const data = await getMyShops()
      setShops(data)
      setError('')
    } catch (err) {
      console.error('Error loading shops:', err)
      setError('Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  const handleShopSelect = async (shopId) => {
    try {
      setLoading(true)
      setSelectedShop(shopId)
      const staff = await getStaffBySalon(shopId)
      setStaffList(staff)
      setSelectedStaff(null)
      setSchedule(null)
      setError('')
    } catch (err) {
      console.error('Error loading staff:', err)
      setError('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSelect = async (staffId) => {
    try {
      setSelectedStaff(staffId)
      setLoading(true)
      await loadSchedule(staffId)
    } catch (err) {
      console.error('Error loading schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async (staffId) => {
    try {
      if (viewMode === 'daily') {
        const data = await getStaffDailySchedule(staffId, selectedDate)
        setSchedule(data)
      } else {
        const data = await getStaffWeeklySchedule(staffId, selectedDate)
        setSchedule(data)
      }
      setError('')
    } catch (err) {
      console.error('Error loading schedule:', err)
      setError('Failed to load schedule')
    }
  }

  const handleDateChange = async (e) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    if (selectedStaff) {
      try {
        setLoading(true)
        if (viewMode === 'daily') {
          const data = await getStaffDailySchedule(selectedStaff, newDate)
          setSchedule(data)
        } else {
          const data = await getStaffWeeklySchedule(selectedStaff, newDate)
          setSchedule(data)
        }
        setError('')
      } catch (err) {
        console.error('Error loading schedule:', err)
        setError('Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleViewModeChange = async (mode) => {
    setViewMode(mode)
    if (selectedStaff) {
      try {
        setLoading(true)
        if (mode === 'daily') {
          const data = await getStaffDailySchedule(selectedStaff, selectedDate)
          setSchedule(data)
        } else {
          const data = await getStaffWeeklySchedule(selectedStaff, selectedDate)
          setSchedule(data)
        }
        setError('')
      } catch (err) {
        console.error('Error loading schedule:', err)
        setError('Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="daily-schedule-page">
      <div className="schedule-container">
        <h1>Daily Schedule</h1>
        <p className="subtitle">View and manage your appointment schedule</p>

        {error && <div className="error-message">{error}</div>}

        <div className="controls-section">
          <div className="control-group">
            <label htmlFor="shop-select">Select Shop</label>
            <select
              id="shop-select"
              value={selectedShop || ''}
              onChange={(e) => handleShopSelect(Number(e.target.value))}
              disabled={loading}
            >
              <option value="">Choose a shop...</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {selectedShop && (
            <div className="control-group">
              <label htmlFor="staff-select">Select Staff Member</label>
              <select
                id="staff-select"
                value={selectedStaff || ''}
                onChange={(e) => handleStaffSelect(Number(e.target.value))}
                disabled={loading || staffList.length === 0}
              >
                <option value="">Choose staff...</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || `Staff #${staff.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedStaff && (
            <>
              <div className="control-group">
                <label htmlFor="date-input">Date</label>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={loading}
                />
              </div>

              <div className="control-group">
                <label>View Mode</label>
                <div className="view-mode-buttons">
                  <button
                    className={`btn-mode ${viewMode === 'daily' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('daily')}
                    disabled={loading}
                  >
                    Daily
                  </button>
                  <button
                    className={`btn-mode ${viewMode === 'weekly' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('weekly')}
                    disabled={loading}
                  >
                    Weekly
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {schedule && (
          <div className="schedule-display">
            {viewMode === 'daily' ? (
              <div className="daily-schedule">
                <div className="schedule-header">
                  <h2>{formatDate(selectedDate)}</h2>
                  <p>
                    {schedule.staff_name} - {schedule.salon_name}
                  </p>
                  <p className="business-hours">
                    Hours: {schedule.business_hours.opening_time} -{' '}
                    {schedule.business_hours.closing_time}
                  </p>
                </div>

                {schedule.appointments.length === 0 ? (
                  <p className="no-appointments">No appointments scheduled</p>
                ) : (
                  <div className="appointments-grid">
                    {schedule.appointments.map((apt) => (
                      <div key={apt.id} className="appointment-slot">
                        <div className="slot-time">
                          {formatTime(apt.starts_at)} -{' '}
                          {formatTime(apt.ends_at)}
                        </div>
                        <div className="slot-client">{apt.client_name}</div>
                        <div className="slot-service">{apt.service}</div>
                        {apt.notes && (
                          <div className="slot-notes">{apt.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {schedule.unavailable_times.length > 0 && (
                  <div className="unavailable-section">
                    <h3>Unavailable Times</h3>
                    <div className="unavailable-list">
                      {schedule.unavailable_times.map((block) => (
                        <div key={block.id} className="unavailable-block">
                          <div className="block-time">
                            {formatTime(block.starts_at)} -{' '}
                            {formatTime(block.ends_at)}
                          </div>
                          <div className="block-reason">{block.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="weekly-schedule">
                <div className="schedule-header">
                  <h2>
                    Week of {formatDate(schedule.week_start)} to{' '}
                    {formatDate(schedule.week_end)}
                  </h2>
                  <p>
                    {schedule.staff_name} - {schedule.salon_name}
                  </p>
                  <p className="total-appointments">
                    Total Appointments: {schedule.total_appointments}
                  </p>
                </div>

                <div className="week-grid">
                  {Object.entries(schedule.schedule_by_day).length === 0 ? (
                    <p className="no-appointments">
                      No appointments scheduled this week
                    </p>
                  ) : (
                    Object.entries(schedule.schedule_by_day).map(
                      ([dayDate, appointments]) => (
                        <div key={dayDate} className="day-column">
                          <h3>{formatDate(dayDate)}</h3>
                          <div className="day-appointments">
                            {appointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="week-appointment"
                              >
                                <div className="apt-time">
                                  {formatTime(apt.starts_at)} -{' '}
                                  {formatTime(apt.ends_at)}
                                </div>
                                <div className="apt-client">
                                  {apt.client_name}
                                </div>
                                <div className="apt-service">{apt.service}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedStaff && !schedule && !loading && (
          <div className="loading-placeholder">
            Select a date to view schedule
          </div>
        )}

        {loading && (
          <div className="loading">
            <p>Loading schedule...</p>
          </div>
        )}
      </div>
    </div>
  )
}
