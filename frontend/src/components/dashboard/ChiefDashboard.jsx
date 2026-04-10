/**
 * Organization-wide dashboard for Chief role (read-only analytics).
 */
import { useEffect, useMemo, useState } from 'react';

import LoadingCard from '../common/LoadingCard.jsx';
import {
  getDashboardCategoryWise,
  getDashboardDepartmentCompletion,
  getDashboardDepartmentKpis,
  getDashboardDepartmentWise,
  getDashboardMonthlyStillActive,
  getDashboardMonthlyTrend,
  getDashboardStatusWise,
  getDashboardSummary,
  getDashboardTechnicianPerformance,
} from '../../services/dashboardService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const CHIEF_SUMMARY_KEYS = [
  { key: 'totalTickets', label: 'Total', icon: 'bi-file-earmark-text' },
  { key: 'openTickets', label: 'Open', icon: 'bi-folder-open' },
  { key: 'assignedTickets', label: 'Assigned', icon: 'bi-person-check' },
  { key: 'inProgressTickets', label: 'In Progress', icon: 'bi-arrow-repeat' },
  { key: 'overdueTickets', label: 'Overdue', icon: 'bi-exclamation-triangle', variant: 'danger' },
  { key: 'resolvedToday', label: 'Resolved Today', icon: 'bi-check-circle', variant: 'success' },
  { key: 'closedToday', label: 'Closed Today', icon: 'bi-x-circle', variant: 'success' },
  { key: 'escalatedTickets', label: 'Escalated', icon: 'bi-arrow-up-circle', variant: 'warning' },
];

const takeTop = (items, limit = 8) => (Array.isArray(items) ? items.slice(0, limit) : []);

function ChiefDashboard({ user }) {
  const [state, setState] = useState({
    status: 'loading',
    summary: null,
    statusWise: null,
    categoryWise: null,
    departmentWise: null,
    departmentCompletion: null,
    departmentKpis: null,
    monthlyTrend: null,
    monthlyStillActive: null,
    workload: null,
    errorMessage: '',
  });

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const [
          summary,
          statusWise,
          categoryWise,
          departmentWise,
          departmentCompletion,
          departmentKpis,
          monthlyTrend,
          monthlyStillActive,
          workload,
        ] = await Promise.all([
          getDashboardSummary(),
          getDashboardStatusWise(),
          getDashboardCategoryWise(),
          getDashboardDepartmentWise(),
          getDashboardDepartmentCompletion(),
          getDashboardDepartmentKpis(),
          getDashboardMonthlyTrend(12),
          getDashboardMonthlyStillActive(12),
          getDashboardTechnicianPerformance(),
        ]);

        if (isCancelled) return;

        setState({
          status: 'ready',
          summary: summary?.data ?? null,
          statusWise: statusWise?.data ?? null,
          categoryWise: categoryWise?.data ?? null,
          departmentWise: departmentWise?.data ?? null,
          departmentCompletion: departmentCompletion?.data ?? null,
          departmentKpis: departmentKpis?.data ?? null,
          monthlyTrend: monthlyTrend?.data ?? null,
          monthlyStillActive: monthlyStillActive?.data ?? null,
          workload: workload?.data ?? null,
          errorMessage: '',
        });
      } catch (error) {
        if (isCancelled) return;
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: getErrorMessage(error, 'Unable to load chief dashboard.'),
        }));
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const topCategories = useMemo(() => takeTop(state.categoryWise?.items, 6), [state.categoryWise?.items]);
  const statusItems = useMemo(() => takeTop(state.statusWise?.items, 14), [state.statusWise?.items]);
  const deptItems = useMemo(() => takeTop(state.departmentWise?.items, 12), [state.departmentWise?.items]);
  const workloadItems = useMemo(() => takeTop(state.workload?.items, 10), [state.workload?.items]);
  const completionRows = useMemo(
    () => (Array.isArray(state.departmentCompletion?.items) ? state.departmentCompletion.items : []),
    [state.departmentCompletion?.items],
  );
  const departmentKpiRows = useMemo(
    () => (Array.isArray(state.departmentKpis?.items) ? state.departmentKpis.items : []),
    [state.departmentKpis?.items],
  );
  const monthlyCreated = useMemo(
    () => (Array.isArray(state.monthlyTrend?.items) ? state.monthlyTrend.items : []),
    [state.monthlyTrend?.items],
  );
  const monthlyActive = useMemo(
    () => (Array.isArray(state.monthlyStillActive?.items) ? state.monthlyStillActive.items : []),
    [state.monthlyStillActive?.items],
  );

  if (state.status === 'loading') {
    return <LoadingCard message="Loading chief dashboard..." />;
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
              <div className="badge rounded-pill text-bg-primary-soft text-primary px-3 py-2 mb-3">Chief Dashboard</div>
              <h1 className="h3 fw-bold text-dark mb-2">Hospital-wide operations overview</h1>
              <p className="text-secondary mb-0">
                All departments, ticket flow, and workload — read-only. Use filters on the Tickets page for deeper slices.
              </p>
            </div>
            <div className="text-start text-lg-end">
              <div className="fw-semibold text-dark">{user?.fullName ?? '—'}</div>
              <div className="small text-secondary">Organization scope</div>
            </div>
          </div>
        </div>
      </section>

      {state.summary ? (
        <section className="row g-3 g-md-4">
          {CHIEF_SUMMARY_KEYS.map(({ key, label, icon, variant }) => {
            const value = state.summary?.[key] ?? 0;
            const isDanger = variant === 'danger' && value > 0;
            const isSuccess = variant === 'success';
            const isWarning = variant === 'warning' && value > 0;
            const cardClass = isDanger ? 'border-danger' : isSuccess ? 'border-success' : isWarning ? 'border-warning' : '';
            return (
              <div key={key} className="col-6 col-md-4 col-xl-3">
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

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5 mb-2 fw-semibold">By handling department — completed vs pending</h2>
          <p className="small text-secondary mb-3">
            Completed counts tickets that are <strong>closed</strong> or <strong>cancelled</strong>. Pending is everything else
            (including resolved awaiting requester confirmation).
          </p>
          {completionRows.length ? (
            <>
              <div className="d-none d-md-block table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Department</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Completed</th>
                      <th className="text-end">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completionRows.map((row) => (
                      <tr key={String(row.departmentId ?? row.name)}>
                        <td className="fw-semibold text-dark">{row.name ?? 'Unknown'}</td>
                        <td className="text-end">{row.total ?? 0}</td>
                        <td className="text-end text-success">{row.completed ?? 0}</td>
                        <td className="text-end text-warning">{row.pending ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-md-none vstack gap-2">
                {completionRows.map((row) => (
                  <div key={String(row.departmentId ?? row.name)} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3">
                      <div className="fw-semibold text-dark mb-2">{row.name ?? 'Unknown'}</div>
                      <div className="row g-2 small text-center">
                        <div className="col-4">
                          <div className="entity-mobile-field-label">Total</div>
                          <div className="fw-medium">{row.total ?? 0}</div>
                        </div>
                        <div className="col-4">
                          <div className="entity-mobile-field-label">Done</div>
                          <div className="text-success fw-medium">{row.completed ?? 0}</div>
                        </div>
                        <div className="col-4">
                          <div className="entity-mobile-field-label">Pending</div>
                          <div className="text-warning fw-medium">{row.pending ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-secondary small">No department data available.</div>
          )}
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5 mb-2 fw-semibold">Department-wise detailed KPI</h2>
          <p className="small text-secondary mb-3">
            Detailed split per department so you can review workload and completion department by department.
          </p>
          {departmentKpiRows.length ? (
            <>
              <div className="d-none d-md-block table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Department</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Open</th>
                      <th className="text-end">Assigned</th>
                      <th className="text-end">In Progress</th>
                      <th className="text-end">Resolved</th>
                      <th className="text-end">Closed</th>
                      <th className="text-end">Cancelled</th>
                      <th className="text-end">Overdue</th>
                      <th className="text-end">Escalated</th>
                      <th className="text-end">Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentKpiRows.map((row) => (
                      <tr key={String(row.departmentId ?? row.name)}>
                        <td className="fw-semibold text-dark">{row.name ?? 'Unknown'}</td>
                        <td className="text-end">{row.total ?? 0}</td>
                        <td className="text-end">{row.open ?? 0}</td>
                        <td className="text-end">{row.assigned ?? 0}</td>
                        <td className="text-end">{row.inProgress ?? 0}</td>
                        <td className="text-end">{row.resolved ?? 0}</td>
                        <td className="text-end">{row.closed ?? 0}</td>
                        <td className="text-end">{row.cancelled ?? 0}</td>
                        <td className="text-end">{row.overdue ?? 0}</td>
                        <td className="text-end">{row.escalated ?? 0}</td>
                        <td className="text-end fw-semibold">{row.completionRate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-md-none vstack gap-3">
                {departmentKpiRows.map((row) => (
                  <div key={String(row.departmentId ?? row.name)} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3">
                      <div className="fw-semibold text-dark mb-3">{row.name ?? 'Unknown'}</div>
                      <div className="vstack gap-2 small entity-mobile-fields">
                        {[
                          ['Total', row.total ?? 0],
                          ['Open', row.open ?? 0],
                          ['Assigned', row.assigned ?? 0],
                          ['In Progress', row.inProgress ?? 0],
                          ['Resolved', row.resolved ?? 0],
                          ['Closed', row.closed ?? 0],
                          ['Cancelled', row.cancelled ?? 0],
                          ['Overdue', row.overdue ?? 0],
                          ['Escalated', row.escalated ?? 0],
                          ['Completion %', `${row.completionRate ?? 0}%`],
                        ].map(([label, value]) => (
                          <div key={label} className="d-flex justify-content-between gap-3">
                            <span className="entity-mobile-field-label mb-0">{label}</span>
                            <span className="text-dark fw-medium text-end">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-secondary small">No department KPI data available.</div>
          )}
        </div>
      </section>

      <section className="row g-3 g-md-4">
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-1 fw-semibold">Tickets created (monthly)</h2>
              <p className="small text-secondary mb-3">Volume of new tickets by calendar month (last 12 months).</p>
              {monthlyCreated.length ? (
                <div className="d-grid gap-2">
                  {monthlyCreated.map((row) => (
                    <div key={String(row.month ?? row.label)} className="d-flex justify-content-between gap-3">
                      <div className="text-secondary">{row.month ?? row.label}</div>
                      <div className="fw-semibold text-dark">{row.count ?? 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-secondary small">No monthly trend data.</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-1 fw-semibold">Still active by month created</h2>
              <p className="small text-secondary mb-3">
                Of tickets created in each month, how many are still not closed or cancelled (backlog by creation month).
              </p>
              {monthlyActive.length ? (
                <div className="d-grid gap-2">
                  {monthlyActive.map((row) => (
                    <div key={String(row.month ?? row.label)} className="d-flex justify-content-between gap-3">
                      <div className="text-secondary">{row.month ?? row.label}</div>
                      <div className="fw-semibold text-dark">{row.count ?? 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-secondary small">No monthly backlog data.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="row g-3 g-md-4">
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0 fw-semibold">Status breakdown</h2>
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

        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0 fw-semibold">Volume by handling department</h2>
                <span className="badge text-bg-light">{deptItems.length}</span>
              </div>
              {deptItems.length ? (
                <div className="d-grid gap-2">
                  {deptItems.map((row) => (
                    <div key={String(row.id ?? row.label)} className="d-flex justify-content-between gap-3">
                      <div className="text-secondary">{row.label ?? 'Unknown'}</div>
                      <div className="fw-semibold text-dark">{row.count ?? 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-secondary small">No department data available.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="row g-3 g-md-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0 fw-semibold">Top categories</h2>
                <span className="badge text-bg-light">{topCategories.length}</span>
              </div>
              {topCategories.length ? (
                <div className="row g-3">
                  {topCategories.map((row) => (
                    <div key={String(row.id ?? row.label)} className="col-12 col-md-6 col-xl-4">
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
            <h2 className="h5 mb-0 fw-semibold">Staff workload (assignees)</h2>
            <span className="badge text-bg-light">{workloadItems.length}</span>
          </div>
          {workloadItems.length ? (
            <>
              <div className="d-none d-md-block table-responsive">
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
              <div className="d-md-none vstack gap-2">
                {workloadItems.map((row) => (
                  <div key={String(row.technicianId ?? row.name)} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3">
                      <div className="fw-semibold text-dark mb-2">{row.name ?? 'Unknown'}</div>
                      <div className="row g-2 small">
                        <div className="col-6">
                          <div className="entity-mobile-field-label">Assigned</div>
                          <div>{row.assignedCount ?? 0}</div>
                        </div>
                        <div className="col-6">
                          <div className="entity-mobile-field-label">Resolved / Closed</div>
                          <div>{row.resolvedCount ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-secondary small">No workload data available.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ChiefDashboard;
