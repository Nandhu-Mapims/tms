import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-app-shell px-3">
      <div className="card border-0 shadow-sm p-4 p-lg-5 text-center" style={{ maxWidth: '540px' }}>
        <div className="display-4 text-primary mb-3">404</div>
        <h1 className="h3 fw-bold text-dark mb-3">Page Not Found</h1>
        <p className="text-secondary mb-4">
          The page you requested is not available in this hospital service interface.
        </p>
        <Link to="/dashboard" className="btn btn-outline-primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
