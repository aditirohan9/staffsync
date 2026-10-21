import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import { useEffect } from 'react';
import '../layout.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((s) => s.auth);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="card shadow-sm auth-card">
        <div className="card-body p-4">
          <h3 className="text-center mb-1"><i className="bi bi-diagram-3-fill text-primary me-2"></i>StaffSync</h3>
          <p className="text-center text-muted mb-4">Sign in to your account</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={onChange} required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={onChange} required />
            </div>
            <button className="btn btn-primary w-100" disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
