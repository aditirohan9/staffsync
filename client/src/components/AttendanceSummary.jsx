// data = { present, late, notCheckedIn }
export default function AttendanceSummary({ title, data }) {
  const total = data.present + data.late + data.notCheckedIn;
  const pct = (n) => (total ? (n / total) * 100 : 0);

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white fw-semibold">{title}</div>
      <div className="card-body">
        <div className="progress mb-3" style={{ height: 14 }}>
          <div className="progress-bar bg-success" style={{ width: `${pct(data.present)}%` }}></div>
          <div className="progress-bar bg-warning" style={{ width: `${pct(data.late)}%` }}></div>
          <div className="progress-bar bg-secondary" style={{ width: `${pct(data.notCheckedIn)}%` }}></div>
        </div>
        <ul className="list-unstyled mb-0">
          <li className="d-flex justify-content-between"><span><span className="badge bg-success me-2">&nbsp;</span>On time</span><strong>{data.present}</strong></li>
          <li className="d-flex justify-content-between"><span><span className="badge bg-warning me-2">&nbsp;</span>Late</span><strong>{data.late}</strong></li>
          <li className="d-flex justify-content-between"><span><span className="badge bg-secondary me-2">&nbsp;</span>Not checked in</span><strong>{data.notCheckedIn}</strong></li>
        </ul>
      </div>
    </div>
  );
}
