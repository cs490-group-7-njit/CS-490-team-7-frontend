import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import SmartHome from './components/SmartHome'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StaffManagementPage from './pages/StaffManagementPage'
import MyShopsPage from './pages/MyShopsPage'
import AddShopPage from './pages/AddShopPage'
import EditShopPage from './pages/EditShopPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SmartHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={(
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/staff"
            element={(
              <PrivateRoute>
                <StaffManagementPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/shops"
            element={(
              <PrivateRoute>
                <MyShopsPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/shops/new"
            element={(
              <PrivateRoute>
                <AddShopPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/shops/:salonId/edit"
            element={(
              <PrivateRoute>
                <EditShopPage />
              </PrivateRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
