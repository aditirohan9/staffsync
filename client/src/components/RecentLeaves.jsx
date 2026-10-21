import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from './StatusBadge';
import { fmtDate } from '../utils/format';

export default function RecentLeaves() {
  const [leaves, setLeaves] = useState(null);

  useEffect(() => {
    api.get('/leaves', { params: { limit: 5 } }).then(({ data }) => setLeaves(data.data)).catch(() => setLeaves([]));
  }, []);

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white d-flex justify-content-between">
        <span className="fw-semibold">Recent leave requests</span>
        <Link to="/leaves" className="small">View all</Link>
      </div>
      <div className="card-body p-0">
        {!leaves ? (
          <div className="text-muted p-3">Loading...</div>
        ) : !leaves.length ? (
          <div className="text-muted p-3">You haven't applied for any leave yet.</div>
        ) : (
          <ul className="list-group list-group-flush">
            {leaves.map((l) => (
              <li key={l._id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{l.leaveType}</div>
                  <small className="text-muted">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</small>
                </div>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
