import { Routes, Route, Navigate } from "react-router-dom";
import { MainPage } from "../pages/MainPage";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Projects } from "../pages/Projects";
import { About } from "../pages/About";
import { ProtectedRoute } from "../components/routes/ProtectedRoute";
import { PublicRoute } from "../components/routes/PublicRoutes";
import ProjectBoard from "../pages/ProjectBoard";
import { Profile } from "../pages/Profile";
import { UserProfile } from "../pages/UserProfile";
import { ProjectStats } from "../pages/ProjectStats";
import { MyTasks } from "../pages/MyTasks";
import { Colleagues } from "../pages/Colleagues";

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
        path="/about"
        element={
          <About />
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/stats"
        element={
          <ProtectedRoute>
            <ProjectStats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:userId"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/colleagues"
        element={
          <ProtectedRoute>
            <Colleagues />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
