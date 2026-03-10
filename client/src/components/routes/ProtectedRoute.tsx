import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import type React from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, loading } = useAuth();

  if (loading) return <div>Loading...</div>

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>
}
