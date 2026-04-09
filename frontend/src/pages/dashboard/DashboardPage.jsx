import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABELS } from '../../config/appConfig';
import { useAuth } from '../../hooks/useAuth';
import {
  getDashboardCategoryWise,
  getDashboardMonthlyTrend,
  getDashboardStatusWise,
  getDashboardSummary,
} from '../../services/dashboardService';
import { getErrorMessage } from '../../utils/getErrorMessage';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import HodDashboard from '../../components/dashboard/HodDashboard.jsx';
import ChiefDashboard from '../../components/dashboard/ChiefDashboard.jsx';

const SUMMARY_CARDS = [
  { key: 'totalTickets', label: 'Total Tickets', icon: 'bi-file-earmark-text' },
  { key: 'openTickets', label: 'Open', icon: 'bi-folder-open' },
  { key: 'assignedTickets', label: 'Assigned', icon: 'bi-person-check' },
  { key: 'inProgressTickets', label: 'In Progress', icon: 'bi-arrow-repeat' },
  { key: 'overdueTickets', label: 'Overdue', icon: 'bi-exclamation-triangle', variant: 'danger' },
  { key: 'resolvedToday', label: 'Resolved Today', icon: 'bi-check-circle', variant: 'success' },
  { key: 'closedToday', label: 'Closed Today', icon: 'bi-x-circle', variant: 'success' },
  { key: 'escalatedTickets', label: 'Escalated', icon: 'bi-arrow-up-circle', variant: 'warning' },
];

const takeTop = (items, limit = 6) => (Array.isArray(items) ? items.slice(0, limit) : []);

function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState({
    summary: null,
    statusWise: null,
    categoryWise: null,
    monthlyTrend: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (user?.role === 'HOD') {
    return <HodDashboard user={user} />;
  }

  if (user?.role === 'CHIEF') {
    return <ChiefDashboard user={user} />;
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summary, statusWise, categoryWise, monthlyTrend] = await Promise.all([
          getDashboardSummary(),
          getDashboardStatusWise(),
          getDashboardCategoryWise(),
          getDashboardMonthlyTrend(6),
        ]);
        setState({
          summary: summary?.data ?? null,
          statusWise: statusWise?.data ?? null,
          categoryWise: categoryWise?.data ?? null,
          monthlyTrend: monthlyTrend?.data ?? null,
        });
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Unable to load dashboard details.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = state.summary;
  const statusItems = useMemo(() => takeTop(state.statusWise?.items, 10), [state.statusWise?.items]);
  const categoryItems = useMemo(() => takeTop(state.categoryWise?.items, 6), [state.categoryWise?.items]);
  const monthlyItems = useMemo(() => takeTop(state.monthlyTrend?.items, 6), [state.monthlyTrend?.items]);

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
                View ticket KPIs and operational summary. Data is scoped to your role and permissions.
              </p>
            </div>
            <div className="col-lg-4">
              <div className="dashboard-stat-panel p-4 rounded-4 h-100">
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Current User</div>
                <div className="h4 fw-bold text-dark mb-1">{user?.fullName ?? '—'}</div>
                <div className="text-secondary mb-3">{user?.email ?? '—'}</div>
                <div className="small text-secondary">Role-based navigation and route protection are active.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert alert-danger mb-0">{errorMessage}</div>
      ) : null}

      {isLoading ? (
        <LoadingCard message="Loading dashboard..." />
      ) : summary ? (
        <>
          <section className="row g-3 g-md-4">
            {SUMMARY_CARDS.map(({ key, label, icon, variant }) => {
              const value = summary[key] ?? 0;
              const isDanger = variant === 'danger' && value > 0;
              const isSuccess = variant === 'success';
              const isWarning = variant === 'warning' && value > 0;
              const cardClass = isDanger ? 'border-danger' : isSuccess ? 'border-success' : isWarning ? 'border-warning' : '';
              return (
                <div key={key} className="col-6 col-md-4 col-lg-3">
                  <div className={`card h-100 border-0 shadow-sm ${cardClass}`}>
                    <div className="card-body p-3 p-md-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className={`bi ${icon} fs-4 text-secondary`} aria-hidden="true" />
                        <span className="small text-secondary text-uppercase fw-semibold">{label}</span>
                      </div>
                      <div className={`h3 fw-bold mb-0 ${isDanger ? 'text-danger' : ''}`}>{value}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="row g-3 g-md-4">
            <div className="col-12 col-xl-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h2 className="h5 mb-3 fw-semibold">Status Breakdown</h2>
                  {statusItems.length ? (
                    <div className="d-grid gap-2">
                      {statusItems.map((row) => (
                        <div key={String(row.id ?? row.label)} className="d-flex justify-content-between gap-3">
                          <div className="text-secondary">{String(row.label ?? 'Unknown').replaceAll('_', ' ')}</div>
                          <div className="fw-semibold text-dark">{row.count ?? 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-secondary small">No status data available.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h2 className="h5 mb-3 fw-semibold">Top Categories</h2>
                  {categoryItems.length ? (
                    <div className="row g-3">
                      {categoryItems.map((row) => (
                        <div key={String(row.id ?? row.label)} className="col-12 col-md-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="small text-secondary mb-1">{row.label ?? 'Unknown'}</div>
                            <div className="h5 fw-bold mb-0">{row.count ?? 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-secondary small">No category data available.</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="row g-3 g-md-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h2 className="h5 mb-1 fw-semibold">Recent Monthly Trend</h2>
                  <p className="small text-secondary mb-3">Tickets created in the last 6 months.</p>
                  {monthlyItems.length ? (
                    <div className="d-grid gap-2">
                      {monthlyItems.map((row) => (
                        <div key={String(row.month ?? row.label)} className="d-flex justify-content-between gap-3">
                          <div className="text-secondary">{row.month ?? row.label}</div>
                          <div className="fw-semibold text-dark">{row.count ?? 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-secondary small">No monthly data available.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default DashboardPage;
