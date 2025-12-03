import { useEffect, useState } from 'react'
import { getMyShops } from '../api/shops'
import { createStaff, deleteStaff, getStaffBySalon, updateStaffSchedule } from '../api/staff'
import VendorPortalLayout from '../components/VendorPortalLayout'
import VendorLoadingState from '../components/VendorLoadingState'
import ScheduleModal from '../components/ScheduleModal'
import { useAuth } from '../context/AuthContext'
import './staff-management.css'

function StaffManagementPage() {
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
          const firstShop = response.salons[0]
          const firstShopId = firstShop.id ?? firstShop.salon_id
          if (firstShopId != null) {
            loadStaff(firstShopId)
            setSelectedShop(firstShop)
          }
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
      console.log('🔍 Loading staff for salon:', salonId)
      const staffArray = await getStaffBySalon(salonId)
      console.log('📋 Staff array:', staffArray)
      if (Array.isArray(staffArray)) {
        console.log(`✅ Loaded ${staffArray.length} staff members`)
        setStaff(staffArray)
      } else {
        console.warn('⚠️ Staff response is not an array')
        setStaff([])
      }
    } catch (err) {
      console.error('❌ Error loading staff:', err)
      setError('Failed to load staff')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopChange = (shopIdentifier) => {
    const shop = shops.find((s) => String(s.id ?? s.salon_id) === String(shopIdentifier))
    if (!shop) {
      return
    }
    setSelectedShop(shop)
    const targetId = shop.id ?? shop.salon_id
    if (targetId != null) {
      loadStaff(targetId)
    }
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
      const targetShopId = selectedShop.id ?? selectedShop.salon_id
      await createStaff(targetShopId, newStaffData)
      setSaveMessage('✅ Staff member added successfully!')
      setNewStaffData({ title: '' })
      setShowAddStaffForm(false)
      loadStaff(targetShopId)
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
      const targetShopId = selectedShop.id ?? selectedShop.salon_id
      await deleteStaff(targetShopId, staffMember.id)
      setSaveMessage('✅ Staff member deleted successfully!')
      loadStaff(targetShopId)
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
      // Make API call to backend to save the schedule
      console.log('Saving schedule for:', scheduleData)
      const targetShopId = selectedShop.id ?? selectedShop.salon_id
      await updateStaffSchedule(targetShopId, scheduleData.staffId, scheduleData.schedule)
      console.log('Schedule saved successfully')

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
      const staffName = selectedStaff?.title || 'Staff member'
      setSaveMessage(`✅ Schedule saved successfully for ${staffName}!`)

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000)

    } catch (error) {
      console.error('Failed to save schedule:', error)
      setSaveMessage('❌ Failed to save schedule. Please try again.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <VendorPortalLayout activeKey="staff">
      <div className="staff-management-page">
        <main className="staff-management-container">
        <div className="staff-management-content">
          <header className="page-header">
            <h1>Staff Management</h1>
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
            <VendorLoadingState message="Loading staff..." />
          ) : (
            <>
              {shops.length > 0 && (
                <div className="shop-selector">
                  <label htmlFor="shop-select">Select Shop:</label>
                  <select
                    id="shop-select"
                    value={selectedShop ? String(selectedShop.id ?? selectedShop.salon_id) : ''}
                    onChange={(e) => handleShopChange(e.target.value)}
                  >
                    {shops.map(shop => (
                      <option key={shop.id ?? shop.salon_id} value={shop.id ?? shop.salon_id}>
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
    </VendorPortalLayout>
  )
}

export default StaffManagementPage