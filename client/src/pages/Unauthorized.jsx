import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="text-center py-5">
      <i className="bi bi-shield-lock display-3 text-danger"></i>
      <h3 className="mt-3">Access denied</h3>
      <p className="text-muted">Your role does not have permission to view this page.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}
