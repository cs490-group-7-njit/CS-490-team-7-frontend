import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyShops } from '../api/salons'
import { getStaffBySalon } from '../api/staff'
import {
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlocksForDate,
  updateTimeBlock
} from '../api/timeblocks'
import './block-time-slots.css'

export default function BlockTimeSlotsPage() {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [timeBlocks, setTimeBlocks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const [formData, setFormData] = useState({
    block_start: '',
    block_end: '',
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      setTimeBlocks([])
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
      await loadTimeBlocks(staffId)
    } catch (err) {
      console.error('Error loading time blocks:', err)
      setError('Failed to load time blocks')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeBlocks = async (staffId) => {
    try {
      const blocks = await getTimeBlocksForDate(staffId, selectedDate)
      setTimeBlocks(blocks)
      setError('')
    } catch (err) {
      console.error('Error loading time blocks:', err)
      setError('Failed to load time blocks')
    }
  }

  const handleDateChange = async (e) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    if (selectedStaff) {
      try {
        setLoading(true)
        const blocks = await getTimeBlocksForDate(selectedStaff, newDate)
        setTimeBlocks(blocks)
        setError('')
      } catch (err) {
        console.error('Error loading time blocks:', err)
        setError('Failed to load time blocks')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.block_start || !formData.block_end || !formData.reason) {
      setError('All fields are required')
      return
    }

    if (formData.block_start >= formData.block_end) {
      setError('End time must be after start time')
      return
    }

    try {
      setLoading(true)
      if (editingBlockId) {
        await updateTimeBlock(editingBlockId, formData)
        setSuccess('Time block updated successfully')
      } else {
        await createTimeBlock(selectedStaff, formData)
        setSuccess('Time block created successfully')
      }
      await loadTimeBlocks(selectedStaff)
      resetForm()
      setError('')
    } catch (err) {
      console.error('Error saving time block:', err)
      setError('Failed to save time block')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (block) => {
    setFormData({
      block_start: block.block_start,
      block_end: block.block_end,
      reason: block.reason,
    })
    setEditingBlockId(block.id)
    setShowForm(true)
  }

  const handleDelete = async (blockId) => {
    if (!window.confirm('Are you sure you want to delete this time block?')) {
      return
    }

    try {
      setLoading(true)
      await deleteTimeBlock(blockId)
      setSuccess('Time block deleted successfully')
      await loadTimeBlocks(selectedStaff)
      setError('')
    } catch (err) {
      console.error('Error deleting time block:', err)
      setError('Failed to delete time block')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      block_start: '',
      block_end: '',
      reason: '',
    })
    setEditingBlockId(null)
    setShowForm(false)
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
    <div className="block-time-slots-page">
      <div className="block-container">
        <h1>Block Time Slots</h1>
        <p className="subtitle">
          Prevent customers from booking during unavailable times
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

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
          )}
        </div>

        {selectedStaff && (
          <div className="content-section">
            <div className="header-row">
              <h2>Time Blocks for {formatDate(selectedDate)}</h2>
              <button
                className="btn-add-block"
                onClick={() => setShowForm(!showForm)}
                disabled={loading}
              >
                {showForm ? 'Cancel' : '+ Add Block'}
              </button>
            </div>

            {showForm && (
              <form className="time-block-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="block-start">Start Time</label>
                  <input
                    id="block-start"
                    type="datetime-local"
                    name="block_start"
                    value={formData.block_start}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="block-end">End Time</label>
                  <input
                    id="block-end"
                    type="datetime-local"
                    name="block_end"
                    value={formData.block_end}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason</label>
                  <input
                    id="reason"
                    type="text"
                    name="reason"
                    placeholder="e.g., Break, Lunch, Training"
                    value={formData.reason}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {editingBlockId ? 'Update Block' : 'Create Block'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {timeBlocks.length === 0 ? (
              <p className="no-blocks">
                No time blocks scheduled for this date
              </p>
            ) : (
              <div className="blocks-list">
                {timeBlocks.map((block) => (
                  <div key={block.id} className="block-card">
                    <div className="block-header">
                      <div className="block-time">
                        <strong>{formatTime(block.block_start)}</strong>
                        <span className="time-separator">–</span>
                        <strong>{formatTime(block.block_end)}</strong>
                      </div>
                      <div className="block-actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(block)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(block.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="block-reason">{block.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <div className="loading">Loading...</div>}
      </div>
    </div>
  )
}
