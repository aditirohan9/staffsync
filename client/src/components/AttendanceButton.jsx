import { useState } from 'react';
import api from '../api/axios';
import StatusBadge from './StatusBadge';
import { fmtTime, errMsg } from '../utils/format';

// today = stats.myAttendance ({ marked, status, checkIn, checkOut }) or null while loading
export default function AttendanceButton({ today, onMarked }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const marked = today?.marked;
  const done = marked && today.checkOut;
  const label = !marked ? 'Check In' : done ? 'Attendance completed' : 'Check Out';

  const mark = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await api.post('/attendance/mark');
      setMsg({ type: 'success', text: data.message });
      onMarked && onMarked();
    } catch (e) {
      setMsg({ type: 'danger', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-3 small">
        {marked ? (
          <>
            <StatusBadge status={today.status} />
            <span className="ms-2">In: <strong>{fmtTime(today.checkIn)}</strong></span>
            <span className="ms-3">Out: <strong>{fmtTime(today.checkOut)}</strong></span>
          </>
        ) : (
          <span className="text-muted">{today ? "You haven't checked in today." : 'Loading...'}</span>
        )}
      </div>
      <button
        className={`btn w-100 ${!marked ? 'btn-primary' : done ? 'btn-secondary' : 'btn-warning'}`}
        disabled={busy || done || !today}
        onClick={mark}
      >
        <i className={`bi ${done ? 'bi-check-circle' : 'bi-fingerprint'} me-2`}></i>
        {busy ? 'Please wait...' : label}
      </button>
      {msg && <div className={`alert alert-${msg.type} py-2 mt-3 mb-0`}>{msg.text}</div>}
    </div>
  );
}
