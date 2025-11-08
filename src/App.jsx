import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import PrivateRoute from "./components/PrivateRoute";
import SmartHome from "./components/SmartHome";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import ClientsPage from "./pages/ClientsPage";
import ClientFormPage from "./pages/ClientFormPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route path="/" element={<SmartHome />} />
          <Route path="/login" element={<LoginPage />} />

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

          {/* UC-2: Client Management */}
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <ClientsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <PrivateRoute>
                <ClientFormPage />
              </PrivateRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
