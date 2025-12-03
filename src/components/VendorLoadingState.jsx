import PropTypes from 'prop-types'
import '../styles/vendor-loading.css'

export default function VendorLoadingState({ message, minHeight, compact }) {
  const style = minHeight ? { minHeight } : undefined

  return (
    <div className={`vendor-loading${compact ? ' vendor-loading--compact' : ''}`} style={style}>
      <div className="vendor-loading-spinner" aria-hidden="true" />
      {message && <p className="vendor-loading-text">{message}</p>}
    </div>
  )
}

VendorLoadingState.propTypes = {
  message: PropTypes.string,
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  compact: PropTypes.bool,
}
