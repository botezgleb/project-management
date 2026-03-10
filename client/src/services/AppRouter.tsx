import { Routes, Route, Navigate } from "react-router-dom";
import { MainPage } from "../pages/MainPage";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Projects } from "../pages/Projects";
import { ProtectedRoute } from "../components/routes/ProtectedRoute";
import { PublicRoute } from "../components/routes/PublicRoutes";
import ProjectBoard from "../pages/ProjectBoard";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectBoard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
