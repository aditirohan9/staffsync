import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';

const Card = ({ icon, label, value, color }) => (
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

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((e) => setError(e.response?.data?.message || 'Could not load stats'));
  }, []);

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
      <div className="row g-3">
        {cards().map((c) => <Card key={c.label} {...c} />)}
      </div>
    </>
  );
}
