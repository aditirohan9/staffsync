import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { fmtDate, errMsg } from '../utils/format';

const EMPTY = { title: '', content: '' };

export default function Announcements() {
  const { user } = useSelector((s) => s.auth);
  const isHR = user.role === 'hr'; // only HR can post (enforced by the API too)

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/announcements', { params: { page, limit: 6 } });
      setItems(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setFormError(''); setShowModal(true); };
  const openEdit = (a) => { setEditingId(a._id); setForm({ title: a.title, content: a.content }); setFormError(''); setShowModal(true); };
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingId) await api.put(`/announcements/${editingId}`, form);
      else await api.post('/announcements', form);
      setShowModal(false);
      setFlash({ type: 'success', text: editingId ? 'Announcement updated.' : 'Announcement posted.' });
      if (!editingId && page !== 1) setPage(1); else load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await api.delete(`/announcements/${a._id}`);
      setFlash({ type: 'success', text: 'Announcement deleted.' });
      load();
    } catch (err) {
      setFlash({ type: 'danger', text: errMsg(err) });
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="mb-0">Announcements</h4>
        {isHR && (
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1"></i>Create new
          </button>
        )}
      </div>

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
          <i className="bi bi-megaphone display-4"></i>
          <p className="mt-2">No announcements yet.</p>
        </div>
      ) : (
        <div className="row g-3">
          {items.map((a) => (
            <div className="col-lg-6" key={a._id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title">{a.title}</h5>
                    {isHR && (
                      <div className="btn-group btn-group-sm ms-2">
                        <button className="btn btn-outline-primary" onClick={() => openEdit(a)} aria-label="Edit"><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-outline-danger" onClick={() => remove(a)} aria-label="Delete"><i className="bi bi-trash"></i></button>
                      </div>
                    )}
                  </div>
                  <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{a.content}</p>
                </div>
                <div className="card-footer bg-white text-muted small d-flex justify-content-between">
                  <span><i className="bi bi-person me-1"></i>{a.postedBy?.name || 'HR'}</span>
                  <span>{fmtDate(a.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal show={showModal} title={editingId ? 'Edit announcement' : 'New announcement'} onClose={() => setShowModal(false)}>
        <form onSubmit={save}>
          {formError && <div className="alert alert-danger py-2">{formError}</div>}
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input name="title" className="form-control" value={form.title} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Content</label>
            <textarea name="content" rows="5" className="form-control" value={form.content} onChange={onChange} required />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Post'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
