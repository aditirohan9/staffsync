import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Login/Register are not shown to users who are already logged in
export default function GuestRoute() {
  const { token, user } = useSelector((s) => s.auth);
  return token && user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
