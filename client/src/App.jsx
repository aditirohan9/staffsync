import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Any logged-in user, inside the shared layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Placeholder title="Attendance" icon="bi-calendar-check" />} />
          <Route path="/leaves" element={<Placeholder title="Leaves" icon="bi-calendar-x" />} />
          <Route path="/announcements" element={<Placeholder title="Announcements" icon="bi-megaphone" />} />
          <Route path="/trainings" element={<Placeholder title="Trainings" icon="bi-mortarboard" />} />
          <Route path="/profile" element={<Placeholder title="My Profile" icon="bi-person-circle" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" icon="bi-bell" />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Role-restricted */}
          <Route element={<ProtectedRoute allowedRoles={['hr', 'manager']} />}>
            <Route path="/employees" element={<Placeholder title="Employees" icon="bi-people" />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
