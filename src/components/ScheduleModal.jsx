import { useEffect, useState } from 'react'
import './ScheduleModal.css'

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const DEFAULT_SCHEDULE = {
  Monday: { enabled: false, shifts: [] },
  Tuesday: { enabled: false, shifts: [] },
  Wednesday: { enabled: false, shifts: [] },
  Thursday: { enabled: false, shifts: [] },
  Friday: { enabled: false, shifts: [] },
  Saturday: { enabled: false, shifts: [] },
  Sunday: { enabled: false, shifts: [] }
}

const createEmptySchedule = () => JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))

const normalizeSchedule = (rawSchedule) => {
  const normalized = createEmptySchedule()

  if (!rawSchedule || typeof rawSchedule !== 'object') {
    return normalized
  }

  Object.keys(normalized).forEach((day) => {
    const dayData = rawSchedule[day]

    if (!dayData || typeof dayData !== 'object') {
      normalized[day] = { enabled: false, shifts: [] }
      return
    }

    const shifts = Array.isArray(dayData.shifts)
      ? dayData.shifts
          .map((shift) => ({
            start: shift.start || shift.begin || shift.from || '',
            end: shift.end || shift.finish || shift.to || ''
          }))
          .filter((shift) => shift.start && shift.end)
      : []

    normalized[day] = {
      enabled: typeof dayData.enabled === 'boolean' ? dayData.enabled : shifts.length > 0,
      shifts
    }
  })

  return normalized
}

function ScheduleModal({ staffMember, onClose, onSave }) {
  const [schedule, setSchedule] = useState(createEmptySchedule())
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (staffMember) {
      setSchedule(normalizeSchedule(staffMember.schedule))
    } else {
      setSchedule(createEmptySchedule())
    }
  }, [staffMember])

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        shifts: !prev[day].enabled ? [{ start: '09:00', end: '17:00' }] : []
      }
    }))

    // Clear any errors for this day
    if (errors[day]) {
      setErrors(prev => ({
        ...prev,
        [day]: null
      }))
    }
  }

  const addShift = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: [...prev[day].shifts, { start: '09:00', end: '17:00' }]
      }
    }))
  }

  const removeShift = (day, shiftIndex) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: prev[day].shifts.filter((_, index) => index !== shiftIndex)
      }
    }))
  }

  const updateShift = (day, shiftIndex, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: prev[day].shifts.map((shift, index) =>
          index === shiftIndex ? { ...shift, [field]: value } : shift
        )
      }
    }))

    // Clear errors when user starts typing
    if (errors[day]) {
      setErrors(prev => ({
        ...prev,
        [day]: null
      }))
    }
  }

  const validateSchedule = () => {
    const newErrors = {}

    Object.keys(schedule).forEach(day => {
      if (!schedule[day].enabled) return

      const shifts = schedule[day].shifts
      if (shifts.length === 0) return

      // Check for overlapping shifts
      for (let i = 0; i < shifts.length; i++) {
        const currentShift = shifts[i]

        // Validate individual shift
        if (currentShift.start >= currentShift.end) {
          newErrors[day] = 'Start time must be before end time'
          break
        }

        // Check for overlaps with other shifts
        for (let j = i + 1; j < shifts.length; j++) {
          const nextShift = shifts[j]

          if (
            (currentShift.start < nextShift.end && currentShift.end > nextShift.start) ||
            (nextShift.start < currentShift.end && nextShift.end > currentShift.start)
          ) {
            newErrors[day] = 'Time slots cannot overlap'
            break
          }
        }

        if (newErrors[day]) break
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateSchedule()) {
      onSave({
        staffId: staffMember.id,
        schedule
      })
    }
  }

  return (
    <div className="modal-overlay">
      <div className="schedule-modal">
        <header className="modal-header">
          <h2>Set Schedule - {staffMember?.title || staffMember?.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        <div className="modal-body">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="day-schedule">
              <div className="day-header">
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={schedule[day].enabled}
                    onChange={() => toggleDay(day)}
                  />
                  <span className="day-name">{day}</span>
                </label>
              </div>

              {schedule[day].enabled && (
                <div className="shifts-container">
                  {schedule[day].shifts.map((shift, index) => (
                    <div key={index} className="shift-row">
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={shift.start}
                          onChange={(e) => updateShift(day, index, 'start', e.target.value)}
                          className="time-input"
                        />
                        <span className="time-separator">to</span>
                        <input
                          type="time"
                          value={shift.end}
                          onChange={(e) => updateShift(day, index, 'end', e.target.value)}
                          className="time-input"
                        />
                      </div>

                      {schedule[day].shifts.length > 1 && (
                        <button
                          className="remove-shift-btn"
                          onClick={() => removeShift(day, index)}
                          title="Remove shift"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    className="add-shift-btn"
                    onClick={() => addShift(day)}
                  >
                    + Add Time Slot
                  </button>

                  {errors[day] && (
                    <div className="error-message">
                      ⚠ {errors[day]}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Schedule
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ScheduleModal