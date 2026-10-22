import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { setUser } from '../store/authSlice';
import { ROLE_BADGE } from '../config/navLinks';
import { fmtDate, errMsg } from '../utils/format';

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [manager, setManager] = useState(null);
  const [form, setForm] = useState({ phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Load the freshest profile (and manager name) from the server
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      const u = data.user;
      setManager(u.managerId || null);
      setForm({ phone: u.phone || '', address: u.address || '', bio: u.bio || '' });
      dispatch(setUser({ ...u, managerId: u.managerId?._id || null }));
    }).catch(() => {});
  }, [dispatch]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await api.put(`/users/${user._id}`, form);
      dispatch(setUser({ ...user, ...data.user, managerId: data.user.managerId || null }));
      setMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMsg({ type: 'danger', text: errMsg(err) });
    } finally {
      setSaving(false);
    }
  };

  const badge = ROLE_BADGE[user.role] || { label: user.role, className: 'bg-secondary' };
  const Row = ({ label, value }) => (
    <li className="list-group-item d-flex justify-content-between">
      <span className="text-muted">{label}</span><span className="text-end">{value || '—'}</span>
    </li>
  );

  return (
    <>
      <h4 className="mb-3">My profile</h4>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fs-1 mb-2" style={{ width: 80, height: 80 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h5 className="mb-1">{user.name}</h5>
              <span className={`badge ${badge.className}`}>{badge.label}</span>
            </div>
            <ul className="list-group list-group-flush">
              <Row label="Email" value={user.email} />
              <Row label="Department" value={user.department} />
              <Row label="Designation" value={user.designation} />
              <Row label="Reports to" value={manager?.name} />
              <Row label="Joined" value={fmtDate(user.joiningDate)} />
            </ul>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-semibold">Personal information</div>
            <div className="card-body">
              {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}
              <form onSubmit={save}>
                <div className="mb-3">
                  <label className="form-label">Phone number</label>
                  <input name="phone" className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={onChange} maxLength={20} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea name="address" rows="2" className="form-control" value={form.address} onChange={onChange} maxLength={200} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Bio</label>
                  <textarea name="bio" rows="4" className="form-control" placeholder="Tell your colleagues a little about yourself" value={form.bio} onChange={onChange} maxLength={500} />
                  <div className="form-text text-end">{form.bio.length}/500</div>
                </div>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
