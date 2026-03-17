import { ROLE_LABELS } from '../../config/appConfig';
import { useAuth } from '../../hooks/useAuth';

function DashboardPage() {
  const { user } = useAuth();

  const placeholderCards = [
    { title: 'Dashboard Analytics', text: 'Summary cards and hospital service trends will be added in the next phase.' },
    { title: 'Operational Queue', text: 'Ticket queue widgets, assignment insights, and SLA indicators will appear here.' },
    { title: 'Role Workspace', text: 'This layout already adapts navigation by role and is ready for module-specific pages.' },
  ];

  return (
    <div className="d-grid gap-4">
      <section className="hero-card card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className="badge rounded-pill text-bg-primary-soft text-primary px-3 py-2 mb-3">
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
              <h1 className="display-6 fw-bold text-dark mb-3">Welcome to the hospital service dashboard.</h1>
              <p className="text-secondary fs-5 mb-0">
                This frontend foundation is connected to secure authentication and ready for ticket operations, master data,
                analytics, and reporting pages.
              </p>
            </div>
            <div className="col-lg-4">
              <div className="dashboard-stat-panel p-4 rounded-4 h-100">
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Current User</div>
                <div className="h4 fw-bold text-dark mb-1">{user?.fullName}</div>
                <div className="text-secondary mb-3">{user?.email}</div>
                <div className="small text-secondary">Role-based navigation is active and route protection is enabled.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="row g-4">
        {placeholderCards.map((card) => (
          <div key={card.title} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h5 fw-semibold text-dark mb-3">{card.title}</h2>
                <p className="text-secondary mb-0">{card.text}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default DashboardPage;
