import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { logout } from '../store/authSlice';
import { ROLE_BADGE } from '../config/navLinks';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Unread count comes from the dashboard stats endpoint
  useEffect(() => {
    let active = true;
    api
      .get('/dashboard/stats')
      .then(({ data }) => active && setUnread(data.stats.unreadNotifications || 0))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const badge = ROLE_BADGE[user.role] || { label: user.role, className: 'bg-secondary' };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar navbar-dark bg-dark fixed-top app-navbar px-3">
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-light btn-sm d-md-none" onClick={onToggleSidebar} aria-label="Toggle menu">
          <i className="bi bi-list"></i>
        </button>
        <Link to="/dashboard" className="navbar-brand mb-0 fw-bold">
          <i className="bi bi-diagram-3-fill me-2 text-info"></i>StaffSync
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Link to="/notifications" className="text-light position-relative" aria-label="Notifications">
          <i className="bi bi-bell fs-5"></i>
          {unread > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
        <div className="d-none d-sm-flex align-items-center gap-2 text-light">
          <span>{user.name}</span>
          <span className={`badge ${badge.className}`}>{badge.label}</span>
        </div>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
    </nav>
  );
}
