import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, loading } = useAuth();

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  if (isAuth) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};
