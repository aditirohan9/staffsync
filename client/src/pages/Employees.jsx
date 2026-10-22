import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { ROLE_BADGE } from '../config/navLinks';
import { fmtDate, errMsg } from '../utils/format';

export default function Employees() {
  const { user: me } = useSelector((s) => s.auth);
  const isHR = me.role === 'hr';

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);

  const [managers, setManagers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: 'employee', department: '', designation: '', managerId: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (debounced) params.search = debounced;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/users', { params });
      setUsers(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // HR needs the list of managers for the "Reports to" dropdown
  useEffect(() => {
    if (!isHR) return;
    api.get('/users', { params: { role: 'manager', limit: 100 } }).then(({ data }) => setManagers(data.data)).catch(() => {});
  }, [isHR]);

  const openEdit = (u) => {
    setEditing(u);
    setFormError('');
    setForm({
      role: u.role,
      department: u.department || '',
      designation: u.designation || '',
      managerId: u.managerId?._id || '',
    });
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.put(`/users/${editing._id}`, { ...form, managerId: form.managerId || null });
      setEditing(null);
      setFlash({ type: 'success', text: 'User updated.' });
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Their attendance, leaves and notifications will also be removed.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      setFlash({ type: 'success', text: `${u.name} deleted.` });
      load();
    } catch (err) {
      setFlash({ type: 'danger', text: errMsg(err) });
    }
  };

  const isSelf = editing && editing._id === me._id;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="mb-0">{isHR ? 'Employee management' : 'My team'} <small className="text-muted fs-6">({total})</small></h4>
        <div className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
          {isHR && (
            <select className="form-select w-auto" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="employee">Employees</option>
              <option value="manager">Managers</option>
              <option value="hr">HR</option>
            </select>
          )}
        </div>
      </div>

      {flash && (
        <div className={`alert alert-${flash.type} alert-dismissible py-2`}>
          {flash.text}
          <button type="button" className="btn-close" onClick={() => setFlash(null)}></button>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {error && <div className="alert alert-danger m-3 py-2">{error}</div>}
          {loading ? (
            <div className="text-muted p-3">Loading...</div>
          ) : !users.length ? (
            <div className="text-center text-muted py-5">
              {isHR || debounced ? 'No users found.' : 'No one reports to you yet. HR can assign team members to you.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th><th>Role</th><th>Department</th><th>Designation</th><th>Reports to</th><th>Joined</th>
                    {isHR && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const b = ROLE_BADGE[u.role] || { label: u.role, className: 'bg-secondary' };
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="fw-semibold">{u.name}</div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td><span className={`badge ${b.className}`}>{b.label}</span></td>
                        <td>{u.department || '—'}</td>
                        <td>{u.designation || '—'}</td>
                        <td>{u.managerId?.name || '—'}</td>
                        <td>{fmtDate(u.joiningDate)}</td>
                        {isHR && (
                          <td className="text-end text-nowrap">
                            <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(u)}>
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button className="btn btn-outline-danger btn-sm" disabled={u._id === me._id} onClick={() => remove(u)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="px-3 pb-3"><Pagination page={page} totalPages={totalPages} onChange={setPage} /></div>
      </div>

      <Modal show={!!editing} title={editing ? `Edit ${editing.name}` : ''} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          {formError && <div className="alert alert-danger py-2">{formError}</div>}
          <div className="mb-3">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" value={form.role} onChange={onChange} disabled={isSelf}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
            {isSelf && <div className="form-text">You cannot change your own role.</div>}
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
          <div className="mb-3">
            <label className="form-label">Reports to</label>
            <select name="managerId" className="form-select" value={form.managerId} onChange={onChange}>
              <option value="">— No manager —</option>
              {managers.filter((m) => m._id !== editing?._id).map((m) => (
                <option key={m._id} value={m._id}>{m.name}{m.department ? ` (${m.department})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
