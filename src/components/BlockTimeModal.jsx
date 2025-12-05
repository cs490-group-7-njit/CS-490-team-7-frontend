import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTimeBlock, deleteTimeBlock, getStaffTimeBlocks } from '../api/staff'
import './BlockTimeModal.css'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const normalizeSchedule = (rawSchedule) => {
	const base = DAY_NAMES.reduce((acc, day) => {
		acc[day] = { enabled: false, shifts: [] }
		return acc
	}, {})

	if (!rawSchedule || typeof rawSchedule !== 'object') {
		return base
	}

	const normalized = { ...base }

	Object.entries(rawSchedule).forEach(([day, config]) => {
		if (!Object.prototype.hasOwnProperty.call(normalized, day) || typeof config !== 'object') {
			return
		}

		const shifts = Array.isArray(config.shifts)
			? config.shifts
					.map((shift) => ({
						start: (shift.start || shift.begin || '').trim(),
						end: (shift.end || shift.finish || '').trim()
					}))
					.filter((shift) => Boolean(shift.start) && Boolean(shift.end))
			: []

		normalized[day] = {
			enabled: Boolean(config.enabled) && shifts.length > 0,
			shifts
		}
	})

	return normalized
}

const getDayNameFromDate = (dateString) => {
	if (!dateString) return null
	const parts = dateString.split('-').map(Number)
	if (parts.length !== 3 || parts.some(Number.isNaN)) return null
	const [year, month, day] = parts
	const utcDate = new Date(Date.UTC(year, month - 1, day))
	return DAY_NAMES[utcDate.getUTCDay()]
}

const toMinutes = (timeValue) => {
	if (!timeValue || typeof timeValue !== 'string') return NaN
	const [hours, minutes] = timeValue.split(':').map(Number)
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN
	return hours * 60 + minutes
}

function BlockTimeModal({ staffMember, onClose }) {
	const [timeBlocks, setTimeBlocks] = useState([])
	const [form, setForm] = useState({ date: '', start: '', end: '', reason: '' })
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const staffId = staffMember?.id
	const normalizedSchedule = useMemo(() => normalizeSchedule(staffMember?.schedule), [staffMember])

		const fetchBlocks = useCallback(async () => {
			if (!staffId) {
				setTimeBlocks([])
				return
			}

			setLoading(true)
			setError('')
			try {
				const blocks = await getStaffTimeBlocks(staffId)
				const now = Date.now()
				const upcoming = []
				const expired = []

				blocks.forEach((block) => {
					const endValue = new Date(block.ends_at || block.end_time)
					if (Number.isNaN(endValue.getTime())) {
						upcoming.push(block)
						return
					}
					if (endValue.getTime() < now) {
						expired.push(block)
					} else {
						upcoming.push(block)
					}
				})

				if (expired.length > 0) {
					await Promise.all(
						expired.map((block) =>
									(block?.id
										? deleteTimeBlock(block.id)
										: Promise.resolve()
									).catch((cleanupErr) => {
								console.warn('Failed to cleanup expired block', cleanupErr)
							})
						)
					)
				}

				setTimeBlocks(upcoming)
			} catch (err) {
				console.error('Failed to load time blocks', err)
				setError('Could not load blocked times.')
			} finally {
				setLoading(false)
			}
		}, [staffId])

		useEffect(() => {
			fetchBlocks()
		}, [fetchBlocks])

	const resetMessages = () => {
		setError('')
		setSuccess('')
	}

	const isFormValid = useMemo(() => {
		return Boolean(form.date && form.start && form.end && form.reason.trim())
	}, [form])

	const handleChange = (field, value) => {
		resetMessages()
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleSubmit = async (event) => {
		event.preventDefault()
		resetMessages()

		if (!staffId || !isFormValid) {
			setError('Please complete all fields.')
			return
		}

		const dayName = getDayNameFromDate(form.date)
		if (!dayName) {
			setError('Please choose a valid date.')
			return
		}

		const daySchedule = normalizedSchedule[dayName]
		if (!daySchedule?.enabled || daySchedule.shifts.length === 0) {
			const staffLabel = staffMember?.title || staffMember?.name || 'This staff member'
			setError(`${staffLabel} is not scheduled to work on ${dayName}.`)
			return
		}

		const blockStartMinutes = toMinutes(form.start)
		const blockEndMinutes = toMinutes(form.end)

		if (Number.isNaN(blockStartMinutes) || Number.isNaN(blockEndMinutes)) {
			setError('Please choose valid start and end times.')
			return
		}

		if (blockEndMinutes <= blockStartMinutes) {
			setError('End time must be after start time.')
			return
		}

		const fitsShift = daySchedule.shifts.some((shift) => {
			const shiftStart = toMinutes(shift.start)
			const shiftEnd = toMinutes(shift.end)
			if (Number.isNaN(shiftStart) || Number.isNaN(shiftEnd)) {
				return false
			}
			return blockStartMinutes >= shiftStart && blockEndMinutes <= shiftEnd
		})

		if (!fitsShift) {
			setError('Blocked time must fall within scheduled working hours.')
			return
		}

			const starts_at = `${form.date}T${form.start}`
			const ends_at = `${form.date}T${form.end}`
			const startDate = new Date(starts_at)
			const endDate = new Date(ends_at)

			if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
				setError('Please choose valid start and end times.')
				return
			}

			if (startDate <= new Date()) {
				setError('Blocked time must start in the future.')
				return
			}

			if (endDate <= startDate) {
				setError('End time must be after start time.')
				return
			}

		try {
			setSaving(true)
			await createTimeBlock(staffId, {
				reason: form.reason.trim(),
				starts_at,
				ends_at,
			})

			setSuccess('Blocked time saved.')
			setForm({ date: '', start: '', end: '', reason: '' })
				await fetchBlocks()
		} catch (err) {
			console.error('Failed to create time block', err)
			setError(err.message || 'Could not save block. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (blockId) => {
		if (!blockId || !window.confirm('Remove this blocked time?')) {
			return
		}

		try {
			resetMessages()
			await deleteTimeBlock(blockId)
			setTimeBlocks((prev) => prev.filter((block) => block.id !== blockId))
			setSuccess('Blocked time removed.')
		} catch (err) {
			console.error('Failed to delete time block', err)
			setError(err.message || 'Could not remove blocked time.')
		}
	}

	const formatDateTime = (value) => {
		if (!value) return ''
		try {
			const date = new Date(value)
			return date.toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			})
		} catch (err) {
			return value
		}
	}

	return (
		<div className="modal-overlay">
			<div className="block-time-modal">
				<header className="modal-header">
					<h2>Block Time - {staffMember?.title || staffMember?.name}</h2>
					<button className="close-btn" onClick={onClose} aria-label="Close">×</button>
				</header>

				<form className="block-form" onSubmit={handleSubmit}>
					<div className="form-row">
						<div className="form-field">
							<label htmlFor="block-date">Date</label>
							<input
								id="block-date"
								type="date"
								value={form.date}
								onChange={(e) => handleChange('date', e.target.value)}
								required
							/>
						</div>
						<div className="form-field">
							<label htmlFor="block-start">Start Time</label>
							<input
								id="block-start"
								type="time"
								value={form.start}
								onChange={(e) => handleChange('start', e.target.value)}
								required
							/>
						</div>
						<div className="form-field">
							<label htmlFor="block-end">End Time</label>
							<input
								id="block-end"
								type="time"
								value={form.end}
								onChange={(e) => handleChange('end', e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="form-field">
						<label htmlFor="block-reason">Reason</label>
						<input
							id="block-reason"
							type="text"
							value={form.reason}
							onChange={(e) => handleChange('reason', e.target.value)}
							placeholder="e.g., Lunch Break, Personal Appointment"
							required
						/>
					</div>

					{error && <div className="feedback error">{error}</div>}
					{success && <div className="feedback success">{success}</div>}

					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" onClick={onClose}>
							Close
						</button>
						<button type="submit" className="btn btn-primary" disabled={!isFormValid || saving}>
							{saving ? 'Saving…' : 'Save Block'}
						</button>
					</div>
				</form>

				<section className="blocked-list">
					<h3>Existing Blocks</h3>
					{loading ? (
						<p className="loading">Loading...</p>
					) : timeBlocks.length === 0 ? (
						<p className="empty">No blocked times set.</p>
					) : (
						<ul>
							{timeBlocks.map((block) => (
								<li key={block.id}>
									<div className="block-info">
										<span className="time-range">
											{formatDateTime(block.starts_at || block.start_time)}
											{' – '}
											{formatDateTime(block.ends_at || block.end_time)}
										</span>
										<span className="reason">{block.reason}</span>
									</div>
									<button
										type="button"
										className="btn btn-outline btn-sm"
										onClick={() => handleDelete(block.id)}
									>
										Remove
									</button>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</div>
	)
}

export default BlockTimeModal

