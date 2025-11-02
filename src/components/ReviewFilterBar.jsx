import { useState } from 'react'
import '../styles/review-filter.css'

function ReviewFilterBar({ onFilterChange, totalReviews, filteredCount }) {
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [minRating, setMinRating] = useState('')

  const handleSortByChange = (e) => {
    const newSortBy = e.target.value
    setSortBy(newSortBy)
    onFilterChange({
      sort_by: newSortBy,
      order: sortOrder,
      min_rating: minRating || undefined,
    })
  }

  const handleSortOrderChange = (e) => {
    const newOrder = e.target.value
    setSortOrder(newOrder)
    onFilterChange({
      sort_by: sortBy,
      order: newOrder,
      min_rating: minRating || undefined,
    })
  }

  const handleRatingFilter = (e) => {
    const rating = e.target.value
    setMinRating(rating)
    onFilterChange({
      sort_by: sortBy,
      order: sortOrder,
      min_rating: rating ? parseInt(rating) : undefined,
    })
  }

  const handleReset = () => {
    setSortBy('date')
    setSortOrder('desc')
    setMinRating('')
    onFilterChange({
      sort_by: 'date',
      order: 'desc',
      min_rating: undefined,
    })
  }

  return (
    <div className="review-filter-bar">
      <div className="filter-info">
        <p className="filter-summary">
          Showing {filteredCount} of {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={handleSortByChange}
            className="filter-select"
          >
            <option value="date">Most Recent</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {sortBy === 'date' && (
          <div className="filter-group">
            <label htmlFor="sort-order">Order:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={handleSortOrderChange}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        )}

        {sortBy === 'rating' && (
          <div className="filter-group">
            <label htmlFor="sort-order">Order:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={handleSortOrderChange}
              className="filter-select"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="min-rating">Minimum Rating:</label>
          <select
            id="min-rating"
            value={minRating}
            onChange={handleRatingFilter}
            className="filter-select"
          >
            <option value="">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
            <option value="3">⭐⭐⭐ 3+ Stars</option>
            <option value="2">⭐⭐ 2+ Stars</option>
            <option value="1">⭐ 1+ Stars</option>
          </select>
        </div>

        {(sortBy !== 'date' || sortOrder !== 'desc' || minRating) && (
          <button
            onClick={handleReset}
            className="reset-button"
            title="Reset filters"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default ReviewFilterBar
