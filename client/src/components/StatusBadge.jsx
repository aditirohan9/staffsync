const COLORS = {
  Pending: 'bg-warning text-dark',
  Approved: 'bg-success',
  Rejected: 'bg-danger',
  Present: 'bg-success',
  Late: 'bg-warning text-dark',
  Absent: 'bg-danger',
  Upcoming: 'bg-primary',
  Completed: 'bg-secondary',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${COLORS[status] || 'bg-secondary'}`}>{status}</span>;
}
