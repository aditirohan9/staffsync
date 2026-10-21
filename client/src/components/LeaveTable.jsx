import StatusBadge from './StatusBadge';
import { fmtDate, dayCount } from '../utils/format';

// canAct => show Approve/Reject on pending rows (never on your own leave)
export default function LeaveTable({ leaves, showEmployee, canAct, currentUserId, onAction, busyId, showApprover = true }) {
  if (!leaves.length) return <div className="text-center text-muted py-4">No leave requests found.</div>;

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {showEmployee && <th>Employee</th>}
            <th>Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
            {showApprover && <th>Decided by</th>}
            {canAct && <th className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => {
            const own = l.userId?._id === currentUserId;
            const actionable = canAct && l.status === 'Pending' && !own;
            return (
              <tr key={l._id}>
                {showEmployee && (
                  <td>
                    <div className="fw-semibold">{l.userId?.name || 'Unknown'}</div>
                    <small className="text-muted">{l.userId?.department || ''}</small>
                  </td>
                )}
                <td>{l.leaveType}</td>
                <td>{fmtDate(l.startDate)}</td>
                <td>{fmtDate(l.endDate)}</td>
                <td>{dayCount(l.startDate, l.endDate)}</td>
                <td className="text-truncate" style={{ maxWidth: 200 }} title={l.reason}>{l.reason}</td>
                <td><StatusBadge status={l.status} /></td>
                {showApprover && <td>{l.approvedBy?.name || '—'}</td>}
                {canAct && (
                  <td className="text-end text-nowrap">
                    {actionable ? (
                      <>
                        <button className="btn btn-success btn-sm me-1" disabled={busyId === l._id} onClick={() => onAction(l._id, 'Approved')}>
                          <i className="bi bi-check-lg"></i> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={busyId === l._id} onClick={() => onAction(l._id, 'Rejected')}>
                          <i className="bi bi-x-lg"></i> Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
