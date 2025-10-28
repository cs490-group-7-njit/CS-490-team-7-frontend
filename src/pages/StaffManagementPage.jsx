import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ScheduleModal from '../components/ScheduleModal'
import { useAuth } from '../context/AuthContext'
import './staff-management.css'

const mockStaffData = [
  {
    id: 1,
    name: 'Sarah',
    title: 'Senior Stylist',
    avatar: '/src/assets/sarah-avatar.jpg', // Add actual avatars later
    hasSchedule: true,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  {
    id: 2,
    name: 'Mark',
    title: 'Barber',
    avatar: '/src/assets/mark-avatar.jpg',
    hasSchedule: true,
    workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }
]

function StaffManagementPage() {
  const navigate = useNavigate()
  const { user, refreshActivity } = useAuth()
  const [staff, setStaff] = useState(mockStaffData)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Refresh user activity when page is accessed
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  const handleViewSchedule = () => {
    // Navigate to a dedicated schedule view page
    navigate('/schedule')
  }

  const handleEditSchedule = (staffMember) => {
    setSelectedStaff(staffMember)
    setShowScheduleModal(true)
  }

  const handleBlockTime = (staffMember) => {
    // Handle time blocking functionality
    console.log('Block time for:', staffMember.name)
  }

  const handleAddStaff = () => {
    // Handle adding new staff member
    console.log('Add new staff member')
  }

  const handleScheduleSave = async (scheduleData) => {
    setIsLoading(true)
    setSaveMessage('')
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update the staff member's schedule in local state
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === scheduleData.staffId 
            ? { 
                ...member, 
                hasSchedule: true,
                workingDays: Object.keys(scheduleData.schedule).filter(
                  day => scheduleData.schedule[day].enabled && scheduleData.schedule[day].shifts.length > 0
                )
              }
            : member
        )
      )

      // Close the modal
      setShowScheduleModal(false)
      
      // Show success feedback
      const staffName = selectedStaff?.name || 'Staff member'
      setSaveMessage(`✅ Schedule saved successfully for ${staffName}!`)
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000)
      
      // TODO: Make API call to backend when ready
      // await updateStaffSchedule(scheduleData.staffId, scheduleData.schedule)
      
    } catch (error) {
      console.error('Failed to save schedule:', error)
      setSaveMessage('❌ Failed to save schedule. Please try again.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page staff-management-page">
      <Header />
      
      <main className="staff-management-container">
        <div className="staff-management-content">
          <header className="page-header">
            <h1>Staff Management</h1>
            <button 
              className="btn btn-secondary view-schedule-btn"
              onClick={handleViewSchedule}
            >
              View Schedule
            </button>
          </header>

          {saveMessage && (
            <div className="save-message">
              {saveMessage}
            </div>
          )}

          <div className="staff-section">
            <h2>My Staff</h2>
            
            <div className="staff-grid">
              {staff.map((staffMember) => (
                <div key={staffMember.id} className="staff-card">
                  <div className="staff-avatar">
                    <div className="avatar-placeholder">
                      {staffMember.name.charAt(0)}
                    </div>
                  </div>
                  
                  <div className="staff-info">
                    <h3>{staffMember.name}</h3>
                    <p className="staff-title">{staffMember.title}</p>
                    
                    {staffMember.hasSchedule && (
                      <div className="working-days">
                        <span className="working-days-label">Working Days:</span>
                        <div className="days-list">
                          {staffMember.workingDays.map(day => (
                            <span key={day} className="day-badge">
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="staff-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEditSchedule(staffMember)}
                    >
                      Edit Schedule
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleBlockTime(staffMember)}
                    >
                      Block Time
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="btn btn-primary add-staff-btn"
              onClick={handleAddStaff}
            >
              + Add Staff
            </button>
          </div>
        </div>
      </main>

      {showScheduleModal && (
        <ScheduleModal
          staffMember={selectedStaff}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleScheduleSave}
        />
      )}
    </div>
  )
}

export default StaffManagementPage