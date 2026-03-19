/**
 * HOD-specific dashboard view (department-scoped, detailed operational insights).
 */
import { useEffect, useMemo, useState } from 'react';

import LoadingCard from '../common/LoadingCard.jsx';
import {
  getDashboardCategoryWise,
  getDashboardStatusWise,
  getDashboardSummary,
  getDashboardTechnicianPerformance,
} from '../../services/dashboardService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const HOD_SUMMARY_KEYS = [
  { key: 'totalTickets', label: 'Total', icon: 'bi-file-earmark-text' },
  { key: 'openTickets', label: 'Open', icon: 'bi-folder-open' },
  { key: 'assignedTickets', label: 'Assigned', icon: 'bi-person-check' },
  { key: 'inProgressTickets', label: 'In Progress', icon: 'bi-arrow-repeat' },
  { key: 'overdueTickets', label: 'Overdue', icon: 'bi-exclamation-triangle', variant: 'danger' },
  { key: 'escalatedTickets', label: 'Escalated', icon: 'bi-arrow-up-circle', variant: 'warning' },
];

const takeTop = (items, limit = 5) => (Array.isArray(items) ? items.slice(0, limit) : []);

function HodDashboard({ user }) {
  const [state, setState] = useState({
    status: 'loading',
    summary: null,
    statusWise: null,
    categoryWise: null,
    workload: null,
    errorMessage: '',
  });

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const [summary, statusWise, categoryWise, workload] = await Promise.all([
          getDashboardSummary(),
          getDashboardStatusWise(),
          getDashboardCategoryWise(),
          getDashboardTechnicianPerformance(),
        ]);

        if (isCancelled) return;

        setState({
          status: 'ready',
          summary: summary?.data ?? null,
          statusWise: statusWise?.data ?? null,
          categoryWise: categoryWise?.data ?? null,
          workload: workload?.data ?? null,
          errorMessage: '',
        });
      } catch (error) {
        if (isCancelled) return;
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: getErrorMessage(error, 'Unable to load HOD dashboard.'),
        }));
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const topCategories = useMemo(() => takeTop(state.categoryWise?.items, 6), [state.categoryWise?.items]);
  const statusItems = useMemo(() => takeTop(state.statusWise?.items, 12), [state.statusWise?.items]);
  const workloadItems = useMemo(() => takeTop(state.workload?.items, 6), [state.workload?.items]);

  if (state.status === 'loading') {
    return <LoadingCard message="Loading HOD dashboard..." />;
  }

  if (state.status === 'error') {
    return <div className="alert alert-danger mb-0">{state.errorMessage}</div>;
  }

  return (
    <div className="d-grid gap-4">
      <section className="hero-card card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <div className="badge rounded-pill text-bg-primary-soft text-primary px-3 py-2 mb-3">HOD Dashboard</div>
              <h1 className="h3 fw-bold text-dark mb-2">Department Operations Overview</h1>
              <p className="text-secondary mb-0">
                Your dashboard is scoped to your department for faster triage and escalation decisions.
              </p>
            </div>
            <div className="text-start text-lg-end">
              <div className="fw-semibold text-dark">{user?.fullName ?? '—'}</div>
              <div className="small text-secondary">Department-scoped view</div>
            </div>
          </div>
        </div>
      </section>

      {state.summary ? (
        <section className="row g-3 g-md-4">
          {HOD_SUMMARY_KEYS.map(({ key, label, icon, variant }) => {
            const value = state.summary?.[key] ?? 0;
            const isDanger = variant === 'danger' && value > 0;
            const isWarning = variant === 'warning' && value > 0;
            const cardClass = isDanger ? 'border-danger' : isWarning ? 'border-warning' : '';
            return (
              <div key={key} className="col-6 col-md-4 col-xl-2">
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
      ) : null}

      <section className="row g-3 g-md-4">
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0 fw-semibold">Status Breakdown</h2>
                <span className="badge text-bg-light">{statusItems.length}</span>
              </div>
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

        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0 fw-semibold">Top Categories</h2>
                <span className="badge text-bg-light">{topCategories.length}</span>
              </div>
              {topCategories.length ? (
                <div className="row g-3">
                  {topCategories.map((row) => (
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

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0 fw-semibold">Helpdesk Workload (Handled By)</h2>
            <span className="badge text-bg-light">{workloadItems.length}</span>
          </div>
          {workloadItems.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Staff</th>
                    <th>Assigned</th>
                    <th>Resolved / Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadItems.map((row) => (
                    <tr key={String(row.technicianId ?? row.name)}>
                      <td className="fw-semibold text-dark">{row.name ?? 'Unknown'}</td>
                      <td>{row.assignedCount ?? 0}</td>
                      <td>{row.resolvedCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-secondary small">No workload data available.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HodDashboard;

