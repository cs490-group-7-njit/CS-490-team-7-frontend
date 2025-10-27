import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import ScheduleModal from '../components/ScheduleModal'
import { useAuth } from '../context/AuthContext'
import { getMyShops } from '../api/shops'
import { getStaffBySalon, createStaff, updateStaff, deleteStaff } from '../api/staff'
import './staff-management.css'

function StaffManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshActivity } = useAuth()
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [staff, setStaff] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showAddStaffForm, setShowAddStaffForm] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newStaffData, setNewStaffData] = useState({ title: '' })

  // Refresh user activity when page is accessed
  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  // Load vendor's shops on mount
  useEffect(() => {
    if (user?.id && user?.role === 'vendor') {
      loadShops()
    }
  }, [user])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMyShops(user.id)
      if (response.salons) {
        setShops(response.salons)
        // Auto-select first shop if available
        if (response.salons.length > 0 && !selectedShop) {
          loadStaff(response.salons[0].id)
          setSelectedShop(response.salons[0])
        }
      }
    } catch (err) {
      setError('Failed to load shops')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStaff = async (salonId) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getStaffBySalon(salonId)
      if (response.staff) {
        setStaff(response.staff)
      }
    } catch (err) {
      setError('Failed to load staff')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopChange = (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    setSelectedShop(shop)
    loadStaff(shopId)
  }

  const handleViewSchedule = () => {
    navigate('/schedule')
  }

  const handleEditSchedule = (staffMember) => {
    setSelectedStaff(staffMember)
    setShowScheduleModal(true)
  }

  const handleBlockTime = (staffMember) => {
    console.log('Block time for:', staffMember.title)
  }

  const handleAddStaff = () => {
    setShowAddStaffForm(true)
  }

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault()
    if (!newStaffData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setIsLoading(true)
      await createStaff(selectedShop.id, newStaffData)
      setSaveMessage('✅ Staff member added successfully!')
      setNewStaffData({ title: '' })
      setShowAddStaffForm(false)
      loadStaff(selectedShop.id)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError('Failed to add staff member')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStaff = async (staffMember) => {
    if (!window.confirm(`Delete ${staffMember.title}?`)) return

    try {
      setIsLoading(true)
      await deleteStaff(selectedShop.id, staffMember.id)
      setSaveMessage('✅ Staff member deleted successfully!')
      loadStaff(selectedShop.id)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError('Failed to delete staff member')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
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

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              {shops.length > 0 && (
                <div className="shop-selector">
                  <label htmlFor="shop-select">Select Shop:</label>
                  <select 
                    id="shop-select"
                    value={selectedShop?.id || ''}
                    onChange={(e) => handleShopChange(parseInt(e.target.value))}
                  >
                    {shops.map(shop => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="staff-section">
                <h2>Staff Members</h2>
                
                {showAddStaffForm && (
                  <form className="add-staff-form" onSubmit={handleAddStaffSubmit}>
                    <div className="form-group">
                      <label htmlFor="staff-title">Title/Position:</label>
                      <input
                        id="staff-title"
                        type="text"
                        value={newStaffData.title}
                        onChange={(e) => setNewStaffData({ title: e.target.value })}
                        placeholder="e.g., Senior Stylist, Barber"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Adding...' : 'Add Staff'}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddStaffForm(false)
                          setNewStaffData({ title: '' })
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                <div className="staff-grid">
                  {staff.length === 0 ? (
                    <p className="empty-state">No staff members added yet</p>
                  ) : (
                    staff.map((staffMember) => (
                      <div key={staffMember.id} className="staff-card">
                        <div className="staff-avatar">
                          <div className="avatar-placeholder">
                            {staffMember.title.charAt(0)}
                          </div>
                        </div>
                        
                        <div className="staff-info">
                          <h3>{staffMember.title}</h3>
                          {staffMember.user && (
                            <p className="staff-name">{staffMember.user.name}</p>
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
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteStaff(staffMember)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {!showAddStaffForm && (
                  <button 
                    className="btn btn-primary add-staff-btn"
                    onClick={handleAddStaff}
                  >
                    + Add Staff
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showScheduleModal && selectedStaff && (
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