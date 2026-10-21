import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="text-center">
        <h1 className="display-1 fw-bold">404</h1>
        <p className="text-muted">Page not found.</p>
        <Link to="/dashboard" className="btn btn-primary">Go home</Link>
      </div>
    </div>
  );
}
