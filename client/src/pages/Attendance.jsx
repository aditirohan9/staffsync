import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import AttendanceButton from '../components/AttendanceButton';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { fmtDate, fmtTime, workedHours, errMsg } from '../utils/format';

export default function Attendance() {
  const { user } = useSelector((s) => s.auth);
  const canViewTeam = user.role !== 'employee';

  const [tab, setTab] = useState('my');
  const [today, setToday] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadToday = useCallback(() => {
    api.get('/dashboard/stats').then(({ data }) => setToday(data.stats.myAttendance)).catch(() => {});
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (date) params.date = date;
      if (status) params.status = status;
      const { data } = await api.get(tab === 'team' ? '/attendance/all' : '/attendance/my', { params });
      setRows(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [tab, page, date, status]);

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { loadRows(); }, [loadRows]);

  const changeTab = (t) => { setTab(t); setPage(1); setDate(''); setStatus(''); };
  const showEmployee = tab === 'team';

  return (
    <>
      <h4 className="mb-3">Attendance</h4>

      <div className="card shadow-sm mb-4" style={{ maxWidth: 420 }}>
        <div className="card-header bg-white fw-semibold">
          Mark today's attendance <small className="text-muted ms-1">{fmtDate(new Date())}</small>
        </div>
        <div className="card-body">
          <AttendanceButton today={today} onMarked={() => { loadToday(); loadRows(); }} />
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            {canViewTeam ? (
              <ul className="nav nav-pills">
                <li className="nav-item"><button className={`nav-link py-1 ${tab === 'my' ? 'active' : ''}`} onClick={() => changeTab('my')}>My history</button></li>
                <li className="nav-item"><button className={`nav-link py-1 ${tab === 'team' ? 'active' : ''}`} onClick={() => changeTab('team')}>{user.role === 'hr' ? 'All employees' : 'My team'}</button></li>
              </ul>
            ) : (
              <span className="fw-semibold">Attendance history</span>
            )}
            <div className="d-flex gap-2">
              <input type="date" className="form-control form-control-sm" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
              <select className="form-select form-select-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All status</option>
                <option>Present</option>
                <option>Late</option>
                <option>Absent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : !rows.length ? (
            <div className="text-center text-muted py-4">No attendance records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {showEmployee && <th>Employee</th>}
                    <th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id}>
                      {showEmployee && (
                        <td>
                          <div className="fw-semibold">{r.userId?.name || 'Unknown'}</div>
                          <small className="text-muted">{r.userId?.department || ''}</small>
                        </td>
                      )}
                      <td>{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>{workedHours(r.checkIn, r.checkOut)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </>
  );
}
