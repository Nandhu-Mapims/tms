import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PaginationControls from '../../components/tickets/PaginationControls.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getDepartments } from '../../services/masterDataService';
import { downloadTicketReportExport, getMonthlyReportBreakdownRequest, getTicketReportRequest } from '../../services/reportService';
import { formatDateTime, getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/ticketHelpers';
import { getErrorMessage } from '../../utils/getErrorMessage';

const LIMIT_OPTIONS = [10, 25, 50, 100];

const initialDraft = {
  month: '',
  startDate: '',
  endDate: '',
  periodField: 'created',
  departmentId: '',
  status: '',
  priority: '',
  sort: 'createdAt',
  page: 1,
  limit: 25,
};

const toMonthStartDate = (monthValue) => {
  const trimmed = String(monthValue ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) return '';
  return `${trimmed}-01`;
};

const toMonthEndDate = (monthValue) => {
  const trimmed = String(monthValue ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) return '';
  const [y, m] = trimmed.split('-').map(Number);
  const end = new Date(y, m, 0);
  const day = String(end.getDate()).padStart(2, '0');
  return `${trimmed}-${day}`;
};

function mergeMonthLists(createdByMonth, closedByMonth) {
  const keys = new Set([
    ...createdByMonth.map((r) => r.month),
    ...closedByMonth.map((r) => r.month),
  ]);
  const createdMap = Object.fromEntries(createdByMonth.map((r) => [r.month, r.count]));
  const closedMap = Object.fromEntries(closedByMonth.map((r) => [r.month, r.count]));
  return [...keys]
    .sort()
    .map((month) => ({
      month,
      created: createdMap[month] ?? 0,
      closed: closedMap[month] ?? 0,
    }));
}

function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [draft, setDraft] = useState(initialDraft);
  const [applied, setApplied] = useState(initialDraft);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canPickDepartment = user?.role === 'ADMIN' || user?.role === 'CHIEF';
  const deptSubtitle =
    user?.role === 'HOD' || user?.role === 'HELPDESK'
      ? 'Reports are limited to tickets routed to your department.'
      : 'Filter by handling department to see assignment and closure detail for that team.';

  const loadMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const params = {};
      if (applied.departmentId && canPickDepartment) params.departmentId = applied.departmentId;
      if (applied.status) params.status = applied.status;
      if (applied.priority) params.priority = applied.priority;
      params.monthsBack = 12;

      const res = await getMonthlyReportBreakdownRequest(params);
      const data = res?.data ?? {};
      const merged = mergeMonthLists(data?.createdByMonth ?? [], data?.closedByMonth ?? []);
      setMonthlyRows(merged);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load monthly breakdown.');
      toast.error(message);
    } finally {
      setLoadingMonthly(false);
    }
  }, [applied.departmentId, applied.status, applied.priority, canPickDepartment, toast]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {
        page: applied.page,
        limit: applied.limit,
        sort: applied.sort,
        periodField: applied.periodField,
      };
      if (applied.month) params.month = applied.month;
      if (!applied.month) {
        if (applied.startDate) params.startDate = applied.startDate;
        if (applied.endDate) params.endDate = applied.endDate;
      }
      if (applied.departmentId && canPickDepartment) params.departmentId = applied.departmentId;
      if (applied.status) params.status = applied.status;
      if (applied.priority) params.priority = applied.priority;

      const res = await getTicketReportRequest(params);
      const list = Array.isArray(res?.data) ? res.data : [];
      const m = res?.meta ?? {};
      setRows(list);
      setMeta(m);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load report.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [applied, canPickDepartment, toast]);

  useEffect(() => {
    const loadDepts = async () => {
      if (!canPickDepartment) return;
      try {
        const res = await getDepartments({ isActive: true });
        setDepartments(res.data ?? []);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load departments.'));
      }
    };
    loadDepts();
  }, [canPickDepartment, toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    loadMonthly();
  }, [loadMonthly]);

  const handleDraft = (name, value) => {
    setDraft((prev) => {
      // Keep month and date range mutually exclusive to avoid ambiguity.
      if (name === 'month') {
        if (!value) {
          return { ...prev, month: '', startDate: '', endDate: '' };
        }
        return {
          ...prev,
          month: value,
          startDate: toMonthStartDate(value),
          endDate: toMonthEndDate(value),
        };
      }
      if (name === 'startDate' || name === 'endDate') {
        return { ...prev, [name]: value, month: value ? '' : prev.month };
      }
      return { ...prev, [name]: value };
    });
  };

  const applyFilters = () => {
    setApplied({ ...draft, page: 1 });
  };

  const resetFilters = () => {
    setDraft(initialDraft);
    setApplied(initialDraft);
  };

  const activeFilterCount = useMemo(() => {
    const f = applied;
    return ['month', 'startDate', 'endDate', 'departmentId', 'status', 'priority'].filter((k) => Boolean(f[k])).length;
  }, [applied]);

  const buildReportParams = useCallback(
    (base = {}) => {
      const params = {
        ...base,
        sort: applied.sort,
        periodField: applied.periodField,
      };
      if (applied.month) params.month = applied.month;
      if (!applied.month) {
        if (applied.startDate) params.startDate = applied.startDate;
        if (applied.endDate) params.endDate = applied.endDate;
      }
      if (applied.departmentId && canPickDepartment) params.departmentId = applied.departmentId;
      if (applied.status) params.status = applied.status;
      if (applied.priority) params.priority = applied.priority;
      return params;
    },
    [applied, canPickDepartment],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await downloadTicketReportExport(buildReportParams({ maxRows: 10000 }));
      const blob = response?.data;
      if (!blob) throw new Error('Empty export file');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `ticket-report-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to download report export.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="d-grid gap-4">
      <PageHeader
        title="Reports"
        subtitle="Detailed ticket list with assignee, issue summary, and how each ticket was closed. Filter by department and month, then review the monthly summary and table below."
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <p className="small text-secondary mb-3">{deptSubtitle}</p>
          <div className="row g-3">
            <div className="col-6 col-lg-3">
              <label className="form-label">Calendar month</label>
              <input
                type="month"
                className="form-control"
                value={draft.month}
                onChange={(e) => handleDraft('month', e.target.value)}
              />
              <div className="form-text">Optional. Overrides the date range below.</div>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Date applies to</label>
              <select
                className="form-select"
                value={draft.periodField}
                onChange={(e) => handleDraft('periodField', e.target.value)}
              >
                <option value="created">Ticket created</option>
                <option value="closed">Ticket closed</option>
                <option value="all">Created or closed (all)</option>
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={draft.startDate}
                onChange={(e) => handleDraft('startDate', e.target.value)}
              />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={draft.endDate}
                onChange={(e) => handleDraft('endDate', e.target.value)}
              />
            </div>
            {canPickDepartment ? (
              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label">Handling department</label>
                <select
                  className="form-select"
                  value={draft.departmentId}
                  onChange={(e) => handleDraft('departmentId', e.target.value)}
                >
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="col-6 col-md-4 col-xl-2">
              <label className="form-label">Status</label>
              <select className="form-select" value={draft.status} onChange={(e) => handleDraft('status', e.target.value)}>
                <option value="">All</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="ON_HOLD">On hold</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <label className="form-label">Priority</label>
              <select className="form-select" value={draft.priority} onChange={(e) => handleDraft('priority', e.target.value)}>
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <label className="form-label">Sort by</label>
              <select className="form-select" value={draft.sort} onChange={(e) => handleDraft('sort', e.target.value)}>
                <option value="createdAt">Created (newest)</option>
                <option value="closedAt">Closed (newest)</option>
                <option value="resolvedAt">Resolved (newest)</option>
              </select>
            </div>
            <div className="col-12 d-flex flex-wrap gap-2 align-items-end">
              <button type="button" className="btn btn-primary" onClick={applyFilters}>
                Apply filters
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
                Reset
              </button>
              <button type="button" className="btn btn-outline-success" onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Downloading...' : 'Download Excel (CSV)'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5 fw-semibold mb-2">Monthly overview</h2>
          <p className="small text-secondary mb-3">
            Tickets <strong>created</strong> per month vs tickets <strong>closed</strong> per month. Uses the same department, status,
            and priority filters as above (rolling last 12 months).
          </p>
          {loadingMonthly ? (
            <LoadingCard message="Loading monthly breakdown..." />
          ) : monthlyRows.length ? (
            <>
              <div className="d-none d-md-block table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Month</th>
                      <th className="text-end">Created</th>
                      <th className="text-end">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRows.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td className="text-end">{row.created}</td>
                        <td className="text-end">{row.closed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-md-none vstack gap-2">
                {monthlyRows.map((row) => (
                  <div key={row.month} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
                      <span className="fw-semibold text-dark">{row.month}</span>
                      <div className="small text-secondary ms-auto">
                        <span className="text-dark fw-medium">{row.created}</span> created ·{' '}
                        <span className="text-dark fw-medium">{row.closed}</span> closed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-secondary small">No monthly data for the current filters.</div>
          )}
        </div>
      </section>

      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2 small text-secondary">
        <div>
          {activeFilterCount ? `${activeFilterCount} filter(s) applied` : 'No date filters — showing latest tickets'}
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span>Rows</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 90 }}
            value={applied.limit}
            onChange={(e) => {
              const limit = Number(e.target.value);
              setDraft((prev) => ({ ...prev, limit, page: 1 }));
              setApplied((prev) => ({ ...prev, limit, page: 1 }));
            }}
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingCard message="Loading report..." />
      ) : rows.length ? (
        <>
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Ticket</th>
                      <th>Issue</th>
                      <th>Handling dept</th>
                      <th>Requester dept</th>
                      <th>Assigned to</th>
                      <th>Raised by</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Resolved</th>
                      <th>Closed</th>
                      <th>Closure</th>
                      <th className="text-end">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="fw-semibold text-nowrap">{row.ticketNumber}</td>
                        <td style={{ maxWidth: 280 }}>
                          <div className="fw-semibold text-dark text-truncate">{row.title}</div>
                          {row.description ? <div className="small text-secondary text-truncate">{row.description}</div> : null}
                        </td>
                        <td>{row.department?.name ?? '—'}</td>
                        <td>{row.requesterDepartment?.name ?? row.department?.name ?? '—'}</td>
                        <td>
                          {row.assignedTo?.fullName ? (
                            <span>
                              {row.assignedTo.fullName}
                              {row.assignedTo?.empId ? <span className="text-secondary small ms-1">({row.assignedTo.empId})</span> : null}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {row.requester?.fullName ? (
                            <span>
                              {row.requester.fullName}
                              {row.requester?.empId ? <span className="text-secondary small ms-1">({row.requester.empId})</span> : null}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(row.status)}`}>{String(row.status ?? '').replaceAll('_', ' ')}</span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${getPriorityBadgeClass(row.priority)}`}>{row.priority}</span>
                        </td>
                        <td className="small text-nowrap">{formatDateTime(row.resolvedAt)}</td>
                        <td className="small text-nowrap">{formatDateTime(row.closedAt)}</td>
                        <td className="small">{row.closureSummary ?? '—'}</td>
                        <td className="text-end">
                          <Link to={`/tickets/${row.ticketNumber}`} className="btn btn-sm btn-outline-primary">
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="d-md-none">
              <div className="vstack gap-3 p-3">
                {rows.map((row) => (
                  <div key={row.id} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="fw-semibold text-dark">{row.ticketNumber}</div>
                        <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                          <span className={`badge ${getStatusBadgeClass(row.status)}`}>{String(row.status ?? '').replaceAll('_', ' ')}</span>
                          <span className={`badge rounded-pill ${getPriorityBadgeClass(row.priority)}`}>{row.priority}</span>
                        </div>
                      </div>
                      <div className="fw-semibold text-dark text-break mb-2">{row.title}</div>
                      {row.description ? <div className="small text-secondary text-break mb-3">{row.description}</div> : null}
                      <div className="vstack gap-2 small entity-mobile-fields">
                        <div>
                          <div className="entity-mobile-field-label">Handling dept</div>
                          <div className="text-break text-dark">{row.department?.name ?? '—'}</div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Requester dept</div>
                          <div className="text-break text-dark">{row.requesterDepartment?.name ?? row.department?.name ?? '—'}</div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Assigned to</div>
                          <div className="text-dark">
                            {row.assignedTo?.fullName ? (
                              <span>
                                {row.assignedTo.fullName}
                                {row.assignedTo?.empId ? <span className="text-secondary small ms-1">({row.assignedTo.empId})</span> : null}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Raised by</div>
                          <div className="text-dark">
                            {row.requester?.fullName ? (
                              <span>
                                {row.requester.fullName}
                                {row.requester?.empId ? <span className="text-secondary small ms-1">({row.requester.empId})</span> : null}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Resolved</div>
                          <div className="text-dark">{formatDateTime(row.resolvedAt)}</div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Closed</div>
                          <div className="text-dark">{formatDateTime(row.closedAt)}</div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Closure</div>
                          <div className="text-break text-dark">{row.closureSummary ?? '—'}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-top">
                        <Link to={`/tickets/${row.ticketNumber}`} className="btn btn-sm btn-outline-primary w-100">
                          Open ticket
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {meta ? (
            <PaginationControls
              meta={meta}
              onPageChange={(page) => {
                setApplied((prev) => ({ ...prev, page }));
                setDraft((prev) => ({ ...prev, page }));
              }}
            />
          ) : null}
        </>
      ) : (
        <EmptyState title="No tickets in this report" description="Adjust filters or date range and try again." />
      )}
    </div>
  );
}

export default ReportsPage;
