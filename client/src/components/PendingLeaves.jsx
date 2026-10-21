import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import LeaveTable from './LeaveTable';
import { errMsg } from '../utils/format';

// Manager/HR: pending requests with quick Approve/Reject
export default function PendingLeaves({ currentUserId, onChanged }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/leaves', { params: { status: 'Pending', limit: 10 } });
      setLeaves(data.data.filter((l) => l.userId?._id !== currentUserId).slice(0, 5));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.put(`/leaves/${id}/status`, { status });
      await load();
      onChanged && onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white fw-semibold">Pending leave requests</div>
      <div className="card-body p-0">
        {error && <div className="alert alert-danger m-3 py-2">{error}</div>}
        {loading ? (
          <div className="text-muted p-3">Loading...</div>
        ) : (
          <LeaveTable leaves={leaves} showEmployee canAct showApprover={false} currentUserId={currentUserId} onAction={act} busyId={busyId} />
        )}
      </div>
    </div>
  );
}
