import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const { loading } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div className="min-h-screen bg-paper" aria-busy="true" />;

  return <>{children}</>;
}
