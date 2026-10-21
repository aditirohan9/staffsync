import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import AttendanceButton from '../components/AttendanceButton';
import AttendanceSummary from '../components/AttendanceSummary';
import PendingLeaves from '../components/PendingLeaves';
import RecentLeaves from '../components/RecentLeaves';
import LatestAnnouncements from '../components/LatestAnnouncements';
import { errMsg } from '../utils/format';

const StatCard = ({ icon, label, value, color }) => (
  <div className="col-sm-6 col-xl-3">
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`rounded-circle bg-${color} bg-opacity-10 text-${color} d-flex align-items-center justify-content-center`} style={{ width: 52, height: 52 }}>
          <i className={`bi ${icon} fs-4`}></i>
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-4 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  </div>
);

const DepartmentBreakdown = ({ items }) => {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white fw-semibold">Department breakdown</div>
      <div className="card-body">
        {!items.length && <div className="text-muted">No data.</div>}
        {items.map((d) => (
          <div key={d.department} className="mb-3">
            <div className="d-flex justify-content-between small">
              <span>{d.department}</span><strong>{d.count}</strong>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar" style={{ width: `${(d.count / max) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeaveOverview = ({ data }) => (
  <div className="card shadow-sm h-100">
    <div className="card-header bg-white fw-semibold">Company leave overview</div>
    <div className="card-body d-flex justify-content-around text-center align-items-center">
      <div><div className="fs-2 fw-semibold text-warning">{data.pending}</div><small className="text-muted">Pending</small></div>
      <div><div className="fs-2 fw-semibold text-success">{data.approved}</div><small className="text-muted">Approved</small></div>
      <div><div className="fs-2 fw-semibold text-danger">{data.rejected}</div><small className="text-muted">Rejected</small></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const loadStats = useCallback(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const cards = () => {
    if (!stats) return [];
    const t = stats.todayAttendance;
    if (user.role === 'employee') {
      return [
        { icon: 'bi-calendar-check', label: "Today's attendance", value: t.marked ? t.status : 'Not marked', color: t.marked ? 'success' : 'secondary' },
        { icon: 'bi-hourglass-split', label: 'Pending leaves', value: stats.pendingLeaves, color: 'warning' },
        { icon: 'bi-check2-circle', label: 'Approved leaves', value: stats.approvedLeaves, color: 'success' },
        { icon: 'bi-mortarboard', label: 'My upcoming trainings', value: stats.activeTrainings, color: 'primary' },
      ];
    }
    return [
      { icon: 'bi-people', label: user.role === 'hr' ? 'Total employees' : 'Team size', value: stats.totalEmployees, color: 'primary' },
      ...(user.role === 'hr' ? [{ icon: 'bi-person-badge', label: 'Total managers', value: stats.totalManagers, color: 'info' }] : []),
      { icon: 'bi-hourglass-split', label: 'Pending leaves', value: stats.pendingLeaves, color: 'warning' },
      { icon: 'bi-calendar-check', label: 'Checked in today', value: t.checkedIn, color: 'success' },
      { icon: 'bi-clock-history', label: 'Late today', value: t.late, color: 'danger' },
      { icon: 'bi-mortarboard', label: 'Active trainings', value: stats.activeTrainings, color: 'secondary' },
    ];
  };

  return (
    <>
      <h4 className="mb-1">Welcome back, {user.name}</h4>
      <p className="text-muted">Here is your overview.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {!stats && !error && <div className="text-muted">Loading...</div>}

      {stats && (
        <>
          <div className="row g-3 mb-4">
            {cards().map((c) => <StatCard key={c.label} {...c} />)}
          </div>

          {user.role === 'employee' && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-lg-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-white fw-semibold">Today's attendance</div>
                    <div className="card-body">
                      <AttendanceButton today={stats.myAttendance} onMarked={loadStats} />
                    </div>
                  </div>
                </div>
                <div className="col-lg-8"><RecentLeaves /></div>
              </div>
              <LatestAnnouncements />
            </>
          )}

          {user.role === 'manager' && (
            <div className="row g-3">
              <div className="col-lg-4">
                <AttendanceSummary title="Team attendance today" data={stats.todayAttendance} />
              </div>
              <div className="col-lg-8">
                <PendingLeaves currentUserId={user._id} onChanged={loadStats} />
              </div>
            </div>
          )}

          {user.role === 'hr' && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-lg-4"><AttendanceSummary title="Company attendance today" data={stats.todayAttendance} /></div>
                <div className="col-lg-4"><LeaveOverview data={stats.leaveOverview} /></div>
                <div className="col-lg-4"><DepartmentBreakdown items={stats.departmentBreakdown} /></div>
              </div>
              <PendingLeaves currentUserId={user._id} onChanged={loadStats} />
            </>
          )}
        </>
      )}
    </>
  );
}
