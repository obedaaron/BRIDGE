import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Landing } from "./pages/Landing";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { CartProvider } from "./context/CartContext";
import { BridgeAssistant } from "./components/BridgeAssistant";
import { CookieConsent } from "./components/CookieConsent";

const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const Signup = lazy(() => import("./pages/Signup").then((module) => ({ default: module.Signup })));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard").then((module) => ({ default: module.VendorDashboard })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((module) => ({ default: module.ForgotPassword })));
const Listings = lazy(() => import("./pages/dashboard/Listings").then((module) => ({ default: module.Listings })));
const Verification = lazy(() => import("./pages/dashboard/Verification").then((module) => ({ default: module.Verification })));
const Settings = lazy(() => import("./pages/dashboard/Settings").then((module) => ({ default: module.Settings })));
const StorefrontPage = lazy(() => import("./pages/StorefrontPage").then((module) => ({ default: module.StorefrontPage })));
const Explore = lazy(() => import("./pages/Explore").then((module) => ({ default: module.Explore })));
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview").then((module) => ({ default: module.AdminOverview })));
const AdminVerifications = lazy(() => import("./pages/admin/Verifications").then((module) => ({ default: module.AdminVerifications })));
const AdminVendors = lazy(() => import("./pages/admin/Vendors").then((module) => ({ default: module.AdminVendors })));
const FraudAlerts = lazy(() => import("./pages/admin/FraudAlerts").then((module) => ({ default: module.FraudAlerts })));
const AdminSettings = lazy(() => import("./pages/admin/Settings").then((module) => ({ default: module.AdminSettings })));
const ReturnRequests = lazy(() => import("./pages/admin/ReturnRequests").then((module) => ({ default: module.ReturnRequests })));
const Messages = lazy(() => import("./pages/Messages").then((module) => ({ default: module.Messages })));
const Conversation = lazy(() => import("./pages/Conversation").then((module) => ({ default: module.Conversation })));
const VendorOrders = lazy(() => import("./pages/dashboard/Orders").then((module) => ({ default: module.Orders })));
const Orders = lazy(() => import("./pages/Orders").then((module) => ({ default: module.Orders })));
const Cart = lazy(() => import("./pages/Cart").then((module) => ({ default: module.Cart })));
const Plans = lazy(() => import("./pages/dashboard/Plans").then((module) => ({ default: module.Plans })));
const Wallet = lazy(() => import("./pages/dashboard/Wallet").then((module) => ({ default: module.Wallet })));
const Legal = lazy(() => import("./pages/Legal").then((module) => ({ default: module.Legal })));
const Promotions = lazy(() => import("./pages/dashboard/Promotions").then((module) => ({ default: module.Promotions })));
const CompanyPage = lazy(() => import("./pages/Company").then((module) => ({ default: module.CompanyPage })));
const ContactPage = lazy(() => import("./pages/Company").then((module) => ({ default: module.ContactPage })));
const NotFound = lazy(() => import("./pages/NotFound").then((module) => ({ default: module.NotFound })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((module) => ({ default: module.ResetPassword })));
const Analytics = lazy(() => import("./pages/dashboard/Analytics").then((module) => ({ default: module.Analytics })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#11110f] font-body text-[#f1eee7]"><span className="inline-flex items-center gap-3"><span className="h-2 w-2 animate-pulse rounded-full bg-[#d6ff57]" />Loading BRIDGE…</span></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/buyer-protection" element={<Legal />} />
          <Route path="/store/:slug" element={<StorefrontPage />} />
          <Route path="/explore" element={<Navigate to={"/stores" + window.location.search} replace />} />
          <Route path="/stores" element={<Explore />} />
          <Route path="/category/:slug" element={<Explore />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/about" element={<CompanyPage />} />
          <Route path="/how-it-works" element={<CompanyPage />} />
          <Route path="/careers" element={<CompanyPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/become-vendor" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
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
          <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><AdminVendors /></AdminRoute>} />
          <Route path="/admin/fraud-alerts" element={<AdminRoute><FraudAlerts /></AdminRoute>} />
          <Route path="/admin/returns" element={<AdminRoute><ReturnRequests /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <BridgeAssistant />
        <CookieConsent />
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
