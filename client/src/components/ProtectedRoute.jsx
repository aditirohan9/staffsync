import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Usage:
//   <Route element={<ProtectedRoute />}>                          -> any logged-in user
//   <Route element={<ProtectedRoute allowedRoles={['hr']} />}>    -> only HR
export default function ProtectedRoute({ allowedRoles }) {
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
