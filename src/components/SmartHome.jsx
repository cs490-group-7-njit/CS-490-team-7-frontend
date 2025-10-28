import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LandingPage from '../pages/LandingPage'

function SmartHome() {
  const { isAuthenticated } = useAuth()

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Otherwise, show the landing page
  return <LandingPage />
}

export default SmartHome