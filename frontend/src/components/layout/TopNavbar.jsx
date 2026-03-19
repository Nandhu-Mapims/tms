import { APP_NAME, ROLE_LABELS } from '../../config/appConfig';
import { useAuth } from '../../hooks/useAuth';

function TopNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="top-navbar bg-white border-bottom px-4 py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
      <div>
        <h2 className="h5 mb-1 fw-semibold text-dark">{APP_NAME} Operations Console</h2>
        <p className="text-secondary small mb-0">Monitor service requests, triage workload, and support clinical operations.</p>
      </div>

      <div className="d-flex align-items-center gap-3 w-100 justify-content-between justify-content-md-end">
        <div className="text-start text-md-end">
          <div className="fw-semibold text-dark">{user?.fullName}</div>
          <div className="small text-secondary">{ROLE_LABELS[user?.role] || user?.role}</div>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
          <i className="bi bi-box-arrow-right me-2"></i>
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default TopNavbar;
