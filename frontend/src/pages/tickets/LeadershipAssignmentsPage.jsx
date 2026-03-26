// Paginated list of tickets assigned to the helpdesk user by HOD or Administrator (direct transfer).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PaginationControls from '../../components/tickets/PaginationControls.jsx';
import { useToast } from '../../hooks/useToast';
import { getLeadershipAssignmentsRequest } from '../../services/ticketService';
import { formatDateTime } from '../../utils/ticketHelpers';
import { getErrorMessage } from '../../utils/getErrorMessage';

const ROWS_PER_PAGE = 10;

const ROLE_LABEL = {
  HOD: 'HOD',
  ADMIN: 'Administrator',
};

function LeadershipAssignmentsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [page, setPage] = useState(1);

  const load = async (nextPage = 1) => {
    const safePage = Number.isFinite(Number(nextPage)) && Number(nextPage) > 0 ? Number(nextPage) : 1;
    setIsLoading(true);
    setPageError('');

    try {
      const response = await getLeadershipAssignmentsRequest({ page: safePage, limit: ROWS_PER_PAGE });
      setItems(response?.data ?? []);
      setMeta(response?.meta ?? null);
      setPage(safePage);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load leadership assignments.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Leadership assignments"
        subtitle="Tickets HOD or Administrator transferred directly to you (not agent transfer requests)."
        actions={[
          <Link key="tickets" to="/tickets" className="btn btn-outline-secondary btn-sm">
            All tickets
          </Link>,
        ]}
      />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}

      {isLoading ? (
        <LoadingCard message="Loading assignments..." />
      ) : items.length ? (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket</th>
                  <th>Subject</th>
                  <th>Assigned by</th>
                  <th>When</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const roleKey = row?.actorRole ?? '';
                  const roleLabel = ROLE_LABEL[roleKey] ?? 'Leadership';
                  const ticketRef = row?.ticketNumber || row?.ticketId || '';

                  return (
                    <tr key={row.id}>
                      <td className="fw-semibold text-dark">{row.ticketNumber || '—'}</td>
                      <td>
                        <span className="text-secondary small">{row.ticketTitle || '—'}</span>
                      </td>
                      <td>
                        <span className="fw-medium">{row.actorName || 'Staff'}</span>
                        <span className="text-secondary small ms-1">({roleLabel})</span>
                      </td>
                      <td className="small text-secondary">{row.createdAt ? formatDateTime(row.createdAt) : '—'}</td>
                      <td className="text-end">
                        {ticketRef ? (
                          <Link to={`/tickets/${ticketRef}`} className="btn btn-sm btn-outline-primary">
                            Open ticket
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <PaginationControls meta={meta} onPageChange={(next) => load(next)} />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No leadership assignments"
          description="You have no tickets on record that were assigned to you directly by HOD or Administrator."
          action={
            <Link to="/tickets" className="btn btn-primary">
              Go to Tickets
            </Link>
          }
        />
      )}
    </>
  );
}

export default LeadershipAssignmentsPage;
