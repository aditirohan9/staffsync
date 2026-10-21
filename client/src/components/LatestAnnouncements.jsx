import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { fmtDate } from '../utils/format';

export default function LatestAnnouncements() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get('/announcements', { params: { limit: 3 } }).then(({ data }) => setItems(data.data)).catch(() => setItems([]));
  }, []);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between">
        <span className="fw-semibold"><i className="bi bi-megaphone me-2"></i>Latest announcements</span>
        <Link to="/announcements" className="small">View all</Link>
      </div>
      <div className="card-body p-0">
        {!items ? (
          <div className="text-muted p-3">Loading...</div>
        ) : !items.length ? (
          <div className="text-muted p-3">No announcements yet.</div>
        ) : (
          <ul className="list-group list-group-flush">
            {items.map((a) => (
              <li key={a._id} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <strong>{a.title}</strong>
                  <small className="text-muted">{fmtDate(a.createdAt)}</small>
                </div>
                <div className="text-muted small">{a.content.length > 140 ? `${a.content.slice(0, 140)}...` : a.content}</div>
                <small className="text-muted">— {a.postedBy?.name || 'HR'}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
