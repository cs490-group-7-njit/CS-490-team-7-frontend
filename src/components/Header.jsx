import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header({ showSearch = true, showSignupLink = false }) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  return (
    <header className={`top-nav ${showSearch ? '' : 'top-nav--compact'}`}>
      <Link to="/" className="brand">
        Beautiful-Hair.com
      </Link>

      {showSearch && (
        <div className="search">
          <button className="menu-button" aria-label="Open navigation">
            <span className="menu-line" />
            <span className="menu-line" />
            <span className="menu-line" />
          </button>
          <input
            type="search"
            placeholder="Search for Salon"
            aria-label="Search for salon"
          />
          <button className="search-button" aria-label="Search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M11 4a7 7 0 0 1 5.196 11.664l4.57 4.57a1 1 0 0 1-1.414 1.414l-4.57-4.57A7 7 0 1 1 11 4m0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      )}

      <nav className="nav-links" aria-label="Primary navigation">
        {!isAuthenticated ? (
          <>
            <a href="#">Salons</a>
            <a href="#">Shops</a>
            {showSignupLink && (
              <Link to="/signup" className="signup-link">
                Signup
              </Link>
            )}
            <a href="#" className="support-link">
              Support
            </a>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/staff" className="nav-link">
              Staff
            </Link>
            <div className="user-menu">
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header
