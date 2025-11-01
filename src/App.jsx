import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import SmartHome from './components/SmartHome'
import { AuthProvider } from './context/AuthContext'
import AddShopPage from './pages/AddShopPage'
import AppointmentBookingPage from './pages/AppointmentBookingPage'
import AppointmentDetailsPage from './pages/AppointmentDetailsPage'
import ClientFormPage from "./pages/ClientFormPage"
import ClientsPage from "./pages/ClientsPage"
import DashboardPage from './pages/DashboardPage'
import EditShopPage from './pages/EditShopPage'
import LoginPage from './pages/LoginPage'
import MyShopsPage from './pages/MyShopsPage'
import RegisterPage from './pages/RegisterPage'
import SalonDetailsPage from './pages/SalonDetailsPage'
import SalonsSearchPage from './pages/SalonsSearchPage'
import ServicesPage from './pages/ServicesPage'
import StaffManagementPage from './pages/StaffManagementPage'
import VendorAppointmentsPage from './pages/VendorAppointmentsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route path="/" element={<SmartHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<RegisterPage />} />

          {/* UC-2.7: Search/Filter Salons */}
          <Route path="/salons/search" element={<SalonsSearchPage />} />

          {/* UC-2.6: View Salon Details */}
          <Route path="/salons/:salonId" element={<SalonDetailsPage />} />

          {/* protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <PrivateRoute>
                <StaffManagementPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/services"
            element={
              <PrivateRoute>
                <ServicesPage />
              </PrivateRoute>
            }
          />

          {/* UC-1: Shop Management */}
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

          {/* UC-2: Client Management */}
          <Route
            path="/clients"
            element={(
              <PrivateRoute>
                <ClientsPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/clients/new"
            element={(
              <PrivateRoute>
                <ClientFormPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.3: Book Appointments */}
          <Route
            path="/appointments"
            element={(
              <PrivateRoute>
                <AppointmentBookingPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.4: View Appointment Details */}
          <Route
            path="/appointments/:appointmentId"
            element={(
              <PrivateRoute>
                <AppointmentDetailsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.5: Manage Appointments (Vendor) */}
          <Route
            path="/vendor/appointments"
            element={(
              <PrivateRoute>
                <VendorAppointmentsPage />
              </PrivateRoute>
            )}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
