import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import SmartHome from './components/SmartHome'
import { AuthProvider } from './context/AuthContext'
import AddShopPage from './pages/AddShopPage'
import AdminHealthPage from './pages/AdminHealthPage'
import AdminSalonsPage from './pages/AdminSalonsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AppointmentBookingPage from './pages/AppointmentBookingPage'
import AppointmentDetailsPage from './pages/AppointmentDetailsPage'
import AppointmentHistoryPage from './pages/AppointmentHistoryPage'
import AppointmentMemosPage from './pages/AppointmentMemosPage'
import BlockTimeSlotsPage from './pages/BlockTimeSlotsPage'
import ClientFormPage from "./pages/ClientFormPage"
import ClientsPage from "./pages/ClientsPage"
import CustomerHistoryPage from './pages/CustomerHistoryPage'
import DailySchedulePage from './pages/DailySchedulePage'
import DashboardPage from './pages/DashboardPage'
import DelayNotificationPage from './pages/DelayNotificationPage'
import DiscountAlertsPage from './pages/DiscountAlertsPage'
import EditShopPage from './pages/EditShopPage'
import FavoriteSalonsPage from './pages/FavoriteSalonsPage'
import LoginPage from './pages/LoginPage'
import LoyaltyPointsPage from './pages/LoyaltyPointsPage'
import MessagesPage from './pages/MessagesPage'
import MyShopsPage from './pages/MyShopsPage'
import NotificationsPage from './pages/NotificationsPage'
import PaymentHistoryPage from './pages/PaymentHistoryPage'
import PaymentMethodsPage from './pages/PaymentMethodsPage'
import PaymentTrackingPage from './pages/PaymentTrackingPage'
import ProfileEditPage from './pages/ProfileEditPage'
import PromotionsPage from './pages/PromotionsPage'
import RegisterPage from './pages/RegisterPage'
import SalonAnalyticsPage from './pages/SalonAnalyticsPage'
import SalonDetailsPage from './pages/SalonDetailsPage'
import SalonsSearchPage from './pages/SalonsSearchPage'
import ServiceImagesPage from './pages/ServiceImagesPage'
import ServicesPage from './pages/ServicesPage'
import SocialMediaPage from './pages/SocialMediaPage'
import StaffManagementPage from './pages/StaffManagementPage'
import StaffRatingPage from './pages/StaffRatingPage'
import VendorAppointmentsPage from './pages/VendorAppointmentsPage'
import VendorReviewsPage from './pages/VendorReviewsPage'

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

          {/* UC-1.11: Reply to Client Reviews */}
          <Route
            path="/vendor/reviews"
            element={(
              <PrivateRoute>
                <VendorReviewsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.12: Send Appointment Memos */}
          <Route
            path="/vendor/appointment-memos"
            element={(
              <PrivateRoute>
                <AppointmentMemosPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.13: View Daily Schedule */}
          <Route
            path="/vendor/schedule"
            element={(
              <PrivateRoute>
                <DailySchedulePage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.14: Block Time Slots */}
          <Route
            path="/vendor/block-time"
            element={(
              <PrivateRoute>
                <BlockTimeSlotsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.15: Track Payments */}
          <Route
            path="/vendor/payments"
            element={(
              <PrivateRoute>
                <PaymentTrackingPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.16: View Customer History */}
          <Route
            path="/vendor/customers"
            element={(
              <PrivateRoute>
                <CustomerHistoryPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.17: Manage Service Images */}
          <Route
            path="/vendor/images"
            element={(
              <PrivateRoute>
                <ServiceImagesPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.18: Send Promotions */}
          <Route
            path="/vendor/promotions"
            element={(
              <PrivateRoute>
                <PromotionsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.19: Notify Clients of Delays */}
          <Route
            path="/vendor/delays"
            element={(
              <PrivateRoute>
                <DelayNotificationPage />
              </PrivateRoute>
            )}
          />

          {/* UC-1.22: Manage Barbers Social Media Links */}
          <Route
            path="/vendor/social-media"
            element={(
              <PrivateRoute>
                <SocialMediaPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.10: Check Loyalty Points */}
          <Route
            path="/loyalty-points"
            element={(
              <PrivateRoute>
                <LoyaltyPointsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.5: View Notifications */}
          <Route
            path="/notifications"
            element={(
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            )}
          />

          <Route
            path="/discount-alerts"
            element={(
              <PrivateRoute>
                <DiscountAlertsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.7: Contact Vendor */}
          <Route
            path="/messages"
            element={(
              <PrivateRoute>
                <MessagesPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.11: View Appointment History */}
          <Route
            path="/appointments/history"
            element={(
              <PrivateRoute>
                <AppointmentHistoryPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.17: Edit Profile */}
          <Route
            path="/profile/edit"
            element={(
              <PrivateRoute>
                <ProfileEditPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.20: Save Favorite Salons */}
          <Route
            path="/favorites"
            element={(
              <PrivateRoute>
                <FavoriteSalonsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.15: View Salon Performance Analytics */}
          <Route
            path="/salons/:salonId/analytics"
            element={(
              <PrivateRoute>
                <SalonAnalyticsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.16: Rate Staff */}
          <Route
            path="/staff/:staffId/rate"
            element={(
              <PrivateRoute>
                <StaffRatingPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.18: Add Payment Method */}
          <Route
            path="/payment-methods"
            element={(
              <PrivateRoute>
                <PaymentMethodsPage />
              </PrivateRoute>
            )}
          />

          {/* UC-2.19: View Payment History */}
          <Route
            path="/payment-history"
            element={(
              <PrivateRoute>
                <PaymentHistoryPage />
              </PrivateRoute>
            )}
          />

          {/* UC 3.1: Admin - View User Data */}
          <Route
            path="/admin/users"
            element={(
              <PrivateRoute>
                <AdminUsersPage />
              </PrivateRoute>
            )}
          />

          {/* UC 3.2: Admin - View Salon Data */}
          <Route
            path="/admin/salons"
            element={(
              <PrivateRoute>
                <AdminSalonsPage />
              </PrivateRoute>
            )}
          />

          {/* UC 3.3: Admin - View Data Visualizations */}
          <Route
            path="/admin/analytics"
            element={(
              <PrivateRoute>
                <AdminAnalyticsPage />
              </PrivateRoute>
            )}
          />

          {/* UC 3.11: Admin - Monitor Platform Health */}
          <Route
            path="/admin/health"
            element={(
              <PrivateRoute>
                <AdminHealthPage />
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
