/**
 * HOD-to-HOD ticket list page.
 * Shows tickets in the HOD's department that were raised by other HODs (requester role = HOD).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PaginationControls from '../../components/tickets/PaginationControls.jsx';
import TicketFilters from '../../components/tickets/TicketFilters.jsx';
import TicketTable from '../../components/tickets/TicketTable.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getCategories, getDepartments } from '../../services/masterDataService';
import { getTicketsRequest } from '../../services/ticketService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const ROWS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 100, label: 'All (max 100)' },
];

function HodToHodTicketsPage() {
  const toast = useToast();
  const { user } = useAuth();

  const lockedDepartmentId = String(user?.departmentId ?? '');
  const initialFilters = useMemo(
    () => ({
      search: '',
      status: '',
      priority: '',
      categoryId: '',
      departmentId: lockedDepartmentId,
      isOverdue: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    }),
    [lockedDepartmentId]
  );

  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [masterData, setMasterData] = useState({ categories: [], departments: [] });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, departmentId: lockedDepartmentId, page: 1 }));
    setDraftFilters((prev) => ({ ...prev, departmentId: lockedDepartmentId, page: 1 }));
  }, [lockedDepartmentId]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [categories, departments] = await Promise.all([
          getCategories({ isActive: true }),
          getDepartments({ isActive: true }),
        ]);
        setMasterData({
          categories: categories?.data ?? [],
          departments: departments?.data ?? [],
        });
        setPageError('');
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to load ticket filter data.');
        setPageError(message);
        toast.error(message);
      }
    };

    loadMasterData();
  }, [toast]);

  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      setPageError('');

      try {
        const effectiveFilters = {
          ...filters,
          assignedRole: 'HOD',
        };

        const response = await getTicketsRequest(effectiveFilters);
        setTickets(response?.data ?? []);
        setMeta(response?.meta ?? null);
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to fetch tickets.');
        setPageError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user?.departmentId) return undefined;
    loadTickets();
  }, [filters, toast, user?.departmentId]);

  const activeFilterCount = ['search', 'status', 'priority', 'categoryId', 'isOverdue', 'startDate', 'endDate']
    .filter((key) => Boolean(filters[key]))
    .length;

  const handleDraftChange = (name, value) => {
    if (name === 'departmentId') return; // department is locked for this view
    setDraftFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      departmentId: lockedDepartmentId,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  const canRaiseTicket = user?.role === 'HOD';
  const actions = canRaiseTicket ? [<Link key="create" to="/tickets/create" className="btn btn-primary">Create Ticket</Link>] : [];

  return (
    <>
      <PageHeader title="HOD to HOD Tickets" subtitle="Tickets in your department managed/assigned to HODs." actions={actions} />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}

      <TicketFilters
        filters={draftFilters}
        categories={masterData.categories}
        departments={masterData.departments}
        userRole={user?.role}
        onChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 small text-secondary">
        <div>{activeFilterCount ? `${activeFilterCount} filter(s) applied` : 'No additional filters applied'}</div>
        <div className="d-flex flex-wrap align-items-center gap-3 justify-content-end">
          {meta ? <div>{meta.total} ticket(s) found</div> : null}
          <div className="d-inline-flex align-items-center gap-2">
            <span>Rows</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={filters.limit}
              onChange={(e) => {
                const nextLimit = Number(e.target.value);
                const limit = Number.isFinite(nextLimit) && nextLimit > 0 ? nextLimit : 10;
                setFilters((prev) => ({ ...prev, limit, page: 1 }));
                setDraftFilters((prev) => ({ ...prev, limit, page: 1 }));
              }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((opt, idx) => (
                <option key={`${opt.value}-${idx}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingCard message="Loading tickets..." />
      ) : tickets.length ? (
        <>
          <TicketTable tickets={tickets} userId={user?.id} userRole={user?.role} isCancelling={false} />
          <PaginationControls meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
        </>
      ) : (
        <EmptyState
          title="No tickets found"
          description="There are no tickets currently assigned to HODs in your department."
          action={canRaiseTicket ? <Link to="/tickets/create" className="btn btn-primary">Create Ticket</Link> : null}
        />
      )}
    </>
  );
}

export default HodToHodTicketsPage;

