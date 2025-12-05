import PropTypes from 'prop-types'
import Header from './Header'
import ClientSidebar from './ClientSidebar'
import '../pages/dashboard.css'

export default function ClientPortalLayout({ activeKey, pageClassName, contentClassName, children }) {
  const pageClasses = ['page', 'dashboard-page']
  if (pageClassName) {
    pageClasses.push(pageClassName)
  }

  const mainClasses = ['dashboard-main']
  if (contentClassName) {
    mainClasses.push(contentClassName)
  }

  return (
    <div className={pageClasses.join(' ')}>
      <Header />
      <div className="dashboard-layout">
        <ClientSidebar activeKey={activeKey} />
        <main className={mainClasses.join(' ')}>
          {children}
        </main>
      </div>
    </div>
  )
}

ClientPortalLayout.propTypes = {
  activeKey: PropTypes.string,
  pageClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
}
