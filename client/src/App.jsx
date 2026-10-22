import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import DashboardLayout from './components/DashboardLayout';
import PageLoader from './components/PageLoader';

// Each page is its own chunk, downloaded only when first visited
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Employees = lazy(() => import('./pages/Employees'));
const Profile = lazy(() => import('./pages/Profile'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Trainings = lazy(() => import('./pages/Trainings'));
const Placeholder = lazy(() => import('./pages/Placeholder'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Any logged-in user, inside the shared layout (layout has its own Suspense) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/trainings" element={<Trainings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Placeholder title="Notifications" icon="bi-bell" />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Role-restricted */}
            <Route element={<ProtectedRoute allowedRoles={['hr', 'manager']} />}>
              <Route path="/employees" element={<Employees />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
