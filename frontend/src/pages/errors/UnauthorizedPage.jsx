import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-app-shell px-3">
      <div className="card border-0 shadow-sm p-4 p-lg-5 text-center" style={{ maxWidth: '520px' }}>
        <div className="display-5 text-warning mb-3">
          <i className="bi bi-shield-lock"></i>
        </div>
        <h1 className="h3 fw-bold text-dark mb-3">Unauthorized Access</h1>
        <p className="text-secondary mb-4">
          Your account does not have permission to open this section of the hospital management console.
        </p>
        <Link to="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
