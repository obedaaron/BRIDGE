import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { VendorDashboard } from "./pages/VendorDashboard";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Listings } from "./pages/dashboard/Listings";
import { Verification } from "./pages/dashboard/Verification";
import { Settings } from "./pages/dashboard/Settings";
import { StorefrontPage } from "./pages/StorefrontPage";
import { Explore } from "./pages/Explore";
import { AdminRoute } from "./components/AdminRoute";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminVerifications } from "./pages/admin/Verifications";
import { AdminVendors } from "./pages/admin/Vendors";
import { Messages } from "./pages/Messages";
import { Conversation } from "./pages/Conversation";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/store/:slug" element={<StorefrontPage />} />
          <Route path="/explore" element={<Explore />} />

          {/* Vendor Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />
          <Route path="/dashboard/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><AdminVendors /></AdminRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}