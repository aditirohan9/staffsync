import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Modal from '../components/Modal';
import LeaveTable from '../components/LeaveTable';
import Pagination from '../components/Pagination';
import { errMsg } from '../utils/format';

const LEAVE_TYPES = ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity', 'Unpaid'];
const EMPTY_FORM = { leaveType: 'Casual', startDate: '', endDate: '', reason: '' };

export default function Leaves() {
  const { user } = useSelector((s) => s.auth);
  const canAct = user.role === 'manager' || user.role === 'hr';

  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const { data } = await api.get('/leaves', { params });
      setLeaves(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.endDate < form.startDate) return setFormError('End date must be on or after the start date.');
    setSubmitting(true);
    try {
      await api.post('/leaves', form);
      setShowModal(false);
      setFlash({ type: 'success', text: 'Leave request submitted.' });
      if (page === 1) load(); else setPage(1);
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (id, newStatus) => {
    setBusyId(id);
    setFlash(null);
    try {
      await api.put(`/leaves/${id}/status`, { status: newStatus });
      setFlash({ type: 'success', text: `Leave ${newStatus.toLowerCase()}.` });
      await load();
    } catch (err) {
      setFlash({ type: 'danger', text: errMsg(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="mb-0">Leave management</h4>
        <button className="btn btn-primary" onClick={openModal}>
          <i className="bi bi-plus-lg me-1"></i>Apply for leave
        </button>
      </div>

      {flash && (
        <div className={`alert alert-${flash.type} alert-dismissible py-2`}>
          {flash.text}
          <button type="button" className="btn-close" onClick={() => setFlash(null)}></button>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            {user.role === 'employee' ? 'My leave requests' : user.role === 'manager' ? 'Team leave requests' : 'All leave requests'}
          </span>
          <select className="form-select form-select-sm w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
        <div className="card-body p-0">
          {error && <div className="alert alert-danger m-3 py-2">{error}</div>}
          {loading ? (
            <div className="text-muted p-3">Loading...</div>
          ) : (
            <LeaveTable
              leaves={leaves}
              showEmployee={canAct}
              canAct={canAct}
              currentUserId={user._id}
              onAction={act}
              busyId={busyId}
            />
          )}
        </div>
        <div className="px-3 pb-3"><Pagination page={page} totalPages={totalPages} onChange={setPage} /></div>
      </div>

      <Modal show={showModal} title="Apply for leave" onClose={() => setShowModal(false)}>
        <form onSubmit={submit}>
          {formError && <div className="alert alert-danger py-2">{formError}</div>}
          <div className="mb-3">
            <label className="form-label">Leave type</label>
            <select name="leaveType" className="form-select" value={form.leaveType} onChange={onChange}>
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="row">
            <div className="col-6 mb-3">
              <label className="form-label">Start date</label>
              <input type="date" name="startDate" className="form-control" value={form.startDate} onChange={onChange} required />
            </div>
            <div className="col-6 mb-3">
              <label className="form-label">End date</label>
              <input type="date" name="endDate" className="form-control" min={form.startDate} value={form.endDate} onChange={onChange} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Reason</label>
            <textarea name="reason" rows="3" className="form-control" value={form.reason} onChange={onChange} required />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit request'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
