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
import { FraudAlerts } from "./pages/admin/FraudAlerts";
import { Messages } from "./pages/Messages";
import { Conversation } from "./pages/Conversation";
import { Orders as VendorOrders } from "./pages/dashboard/Orders";
import { Orders } from "./pages/Orders";
import { Cart } from "./pages/Cart";
import { CartProvider } from "./context/CartContext";
import { Plans } from "./pages/dashboard/Plans";
import { Wallet } from "./pages/dashboard/Wallet";
import { Legal } from "./pages/Legal";
import { Promotions } from "./pages/dashboard/Promotions";
import { CompanyPage, ContactPage } from "./pages/Company";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/buyer-protection" element={<Legal />} />
          <Route path="/store/:slug" element={<StorefrontPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<CompanyPage />} />
          <Route path="/how-it-works" element={<CompanyPage />} />
          <Route path="/careers" element={<CompanyPage />} />
          <Route path="/contact" element={<ContactPage />} />

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
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/dashboard/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
          <Route path="/dashboard/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/dashboard/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/dashboard/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><AdminVendors /></AdminRoute>} />
          <Route path="/admin/fraud-alerts" element={<AdminRoute><FraudAlerts /></AdminRoute>} />
        </Routes>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
