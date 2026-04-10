import { APP_NAME, ROLE_LABELS } from '../../config/appConfig';
import { useAuth } from '../../hooks/useAuth';

function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="top-navbar bg-white border-bottom px-3 px-md-4 py-3">
      <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
        <div className="d-flex align-items-start gap-2 gap-md-3 min-w-0">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-lg-none flex-shrink-0 mt-1"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <i className="bi bi-list fs-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h2 className="h5 mb-1 fw-semibold text-dark">{APP_NAME} Operations Console</h2>
            <p className="text-secondary small mb-0 d-none d-sm-block">
              Monitor service requests, triage workload, and support clinical operations.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0 justify-content-between justify-content-lg-end">
          <div className="text-start text-lg-end min-w-0">
            <div className="fw-semibold text-dark text-truncate">{user?.fullName}</div>
            <div className="small text-secondary">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <i className="bi bi-box-arrow-right d-md-none fs-5" aria-hidden="true" />
            <span className="d-none d-md-inline">
              <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
