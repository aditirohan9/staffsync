import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';
import '../layout.css';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: 'employee', department: '', designation: '',
  });
  const [localError, setLocalError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.password.length < 6) return setLocalError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setLocalError('Passwords do not match.');

    const { confirm, ...payload } = form;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="card shadow-sm auth-card">
        <div className="card-body p-4">
          <h3 className="text-center mb-1">Create account</h3>
          <p className="text-center text-muted mb-4">Join StaffSync</p>

          {(localError || error) && <div className="alert alert-danger py-2">{localError || error}</div>}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input name="name" className="form-control" value={form.name} onChange={onChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={onChange} required />
            </div>
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-control" value={form.password} onChange={onChange} required />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label">Confirm</label>
                <input type="password" name="confirm" className="form-control" value={form.confirm} onChange={onChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select name="role" className="form-select" value={form.role} onChange={onChange}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label">Department</label>
                <input name="department" className="form-control" value={form.department} onChange={onChange} />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label">Designation</label>
                <input name="designation" className="form-control" value={form.designation} onChange={onChange} />
              </div>
            </div>
            <button className="btn btn-primary w-100" disabled={status === 'loading'}>
              {status === 'loading' ? 'Creating...' : 'Register'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
