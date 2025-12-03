import PropTypes from 'prop-types'
import Header from './Header'
import VendorSidebar from './VendorSidebar'
import '../styles/vendor-portal-layout.css'

export default function VendorPortalLayout({ activeKey, children }) {
  return (
    <div className="vendor-portal-page">
      <Header showSearch={false} />
      <div className="vendor-portal-layout">
        <VendorSidebar activeKey={activeKey} />
        <main className="vendor-portal-main">
          {children}
        </main>
      </div>
    </div>
  )
}

VendorPortalLayout.propTypes = {
  activeKey: PropTypes.string,
  children: PropTypes.node.isRequired,
}
