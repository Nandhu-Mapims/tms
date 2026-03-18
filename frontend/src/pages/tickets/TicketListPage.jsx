import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PaginationControls from '../../components/tickets/PaginationControls.jsx';
import TicketFilters from '../../components/tickets/TicketFilters.jsx';
import TicketTable from '../../components/tickets/TicketTable.jsx';
import { useToast } from '../../hooks/useToast';
import { getCategories, getDepartments } from '../../services/masterDataService';
import { getTicketsRequest } from '../../services/ticketService';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/getErrorMessage';

const initialFilters = {
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  departmentId: '',
  assignedToId: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10,
};

function TicketListPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [masterData, setMasterData] = useState({ categories: [], departments: [] });

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [categories, departments] = await Promise.all([
          getCategories({ isActive: true }),
          getDepartments({ isActive: true }),
        ]);
        setMasterData({ categories: categories.data, departments: departments.data });
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
        const response = await getTicketsRequest(filters);
        setTickets(response.data);
        setMeta(response.meta);
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to fetch tickets.');
        setPageError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [filters, toast]);

  const handleDraftChange = (name, value) => {
    setDraftFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters, page: 1 });
  };

  const handleResetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  const actions = user?.role === 'REQUESTER'
    ? [<Link key="create" to="/tickets/create" className="btn btn-primary">Create Ticket</Link>]
    : [];
  const activeFilterCount = ['search', 'status', 'priority', 'categoryId', 'departmentId', 'assignedToId', 'startDate', 'endDate']
    .filter((key) => Boolean(filters[key])).length;

  return (
    <>
      <PageHeader title="Tickets" subtitle="Track hospital requests, assignments, and service progress." actions={actions} />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}
      <TicketFilters
        filters={draftFilters}
        categories={masterData.categories}
        departments={masterData.departments}
        onChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 small text-secondary">
        <div>{activeFilterCount ? `${activeFilterCount} filter(s) applied` : 'No additional filters applied'}</div>
        {meta ? <div>{meta.total} ticket(s) found</div> : null}
      </div>

      {isLoading ? (
        <LoadingCard message="Loading tickets..." />
      ) : tickets.length ? (
        <>
          <TicketTable tickets={tickets} />
          <PaginationControls meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
        </>
      ) : (
        <EmptyState
          title="No tickets found"
          description="There are no tickets matching the selected filters."
          action={
            user?.role === 'REQUESTER' ? (
              <Link to="/tickets/create" className="btn btn-primary">
                Create Ticket
              </Link>
            ) : null
          }
        />
      )}
    </>
  );
}

export default TicketListPage;
