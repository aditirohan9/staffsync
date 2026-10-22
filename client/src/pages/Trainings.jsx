import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { errMsg } from '../utils/format';

const EMPTY = { title: '', description: '', participants: [] };
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'Upcoming', label: 'Upcoming' },
  { key: 'Completed', label: 'Completed' },
  { key: 'mine', label: 'Mine' },
];

export default function Trainings() {
  const { user } = useSelector((s) => s.auth);
  const canCreate = user.role === 'hr' || user.role === 'manager';
  const canEnroll = user.role === 'employee' || user.role === 'manager';

  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [candidates, setCandidates] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 9 };
      if (tab === 'mine') params.mine = 'true';
      else if (tab !== 'all') params.status = tab;
      const { data } = await api.get('/trainings', { params });
      setItems(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(EMPTY);
    setFormError('');
    setShowModal(true);
    try {
      // HR sees everyone; a manager's list is already limited to their team
      const { data } = await api.get('/users', { params: { limit: 100 } });
      setCandidates(data.data.filter((u) => u._id !== user._id));
    } catch {
      setCandidates([]);
    }
  };

  const toggleParticipant = (id) =>
    setForm((f) => ({
      ...f,
      participants: f.participants.includes(id) ? f.participants.filter((p) => p !== id) : [...f.participants, id],
    }));

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/trainings', form);
      setShowModal(false);
      setFlash({ type: 'success', text: 'Training created.' });
      if (page !== 1) setPage(1); else load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const run = async (id, fn, okText) => {
    setBusyId(id);
    setFlash(null);
    try {
      await fn();
      setFlash({ type: 'success', text: okText });
      await load();
    } catch (err) {
      setFlash({ type: 'danger', text: errMsg(err) });
    } finally {
      setBusyId(null);
    }
  };

  const enroll = (t) => run(t._id, () => api.put(`/trainings/${t._id}/enroll`), `Enrolled in "${t.title}".`);
  const complete = (t) => run(t._id, () => api.put(`/trainings/${t._id}`, { status: 'Completed' }), 'Marked as completed.');
  const remove = (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    run(t._id, () => api.delete(`/trainings/${t._id}`), 'Training deleted.');
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="mb-0">Training programs</h4>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1"></i>Create new
          </button>
        )}
      </div>

      <ul className="nav nav-pills mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link py-1 ${tab === t.key ? 'active' : ''}`} onClick={() => { setTab(t.key); setPage(1); }}>{t.label}</button>
          </li>
        ))}
      </ul>

      {flash && (
        <div className={`alert alert-${flash.type} alert-dismissible py-2`}>
          {flash.text}
          <button type="button" className="btn-close" onClick={() => setFlash(null)}></button>
        </div>
      )}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : !items.length ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-mortarboard display-4"></i>
          <p className="mt-2">No trainings found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {items.map((t) => {
            const canManage = user.role === 'hr' || t.assignedBy?._id === user._id;
            const names = (t.participants || []).map((p) => p.name).filter(Boolean);
            return (
              <div className="col-md-6 col-xl-4" key={t._id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{t.title}</h5>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="card-text text-muted">{t.description || 'No description provided.'}</p>
                    <div className="small text-muted">
                      <div><i className="bi bi-person-workspace me-1"></i>By {t.assignedBy?.name || 'Unknown'}</div>
                      <div><i className="bi bi-people me-1"></i>{t.participantCount} participant{t.participantCount === 1 ? '' : 's'}</div>
                      {names.length > 0 && (
                        <div className="mt-1">{names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3} more` : ''}</div>
                      )}
                    </div>
                  </div>
                  <div className="card-footer bg-white d-flex justify-content-between align-items-center gap-2">
                    <div>
                      {canEnroll && t.status === 'Upcoming' && (
                        t.isEnrolled ? (
                          <button className="btn btn-success btn-sm" disabled><i className="bi bi-check-circle me-1"></i>Enrolled</button>
                        ) : (
                          <button className="btn btn-primary btn-sm" disabled={busyId === t._id} onClick={() => enroll(t)}>Enroll</button>
                        )
                      )}
                      {canEnroll && t.status === 'Completed' && t.isEnrolled && <span className="text-success small"><i className="bi bi-check2-all me-1"></i>Attended</span>}
                    </div>
                    {canManage && (
                      <div className="btn-group btn-group-sm">
                        {t.status === 'Upcoming' && (
                          <button className="btn btn-outline-success" disabled={busyId === t._id} onClick={() => complete(t)}>Mark completed</button>
                        )}
                        <button className="btn btn-outline-danger" disabled={busyId === t._id} onClick={() => remove(t)} aria-label="Delete"><i className="bi bi-trash"></i></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal show={showModal} title="New training" onClose={() => setShowModal(false)}>
        <form onSubmit={create}>
          {formError && <div className="alert alert-danger py-2">{formError}</div>}
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea rows="3" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Add participants <small className="text-muted">(optional, others can enroll themselves)</small></label>
            <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
              {!candidates.length && <div className="text-muted small">No users available.</div>}
              {candidates.map((c) => (
                <div className="form-check" key={c._id}>
                  <input className="form-check-input" type="checkbox" id={`p-${c._id}`} checked={form.participants.includes(c._id)} onChange={() => toggleParticipant(c._id)} />
                  <label className="form-check-label" htmlFor={`p-${c._id}`}>{c.name} <small className="text-muted">{c.department || ''}</small></label>
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create training'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
