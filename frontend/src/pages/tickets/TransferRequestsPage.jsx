// Ticket transfer requests page for helpdesk agents.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PaginationControls from '../../components/tickets/PaginationControls.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import {
  approveTicketTransferRequest,
  getReceivedTicketTransferRequests,
  getSentTicketTransferRequests,
  rejectTicketTransferRequest,
} from '../../services/ticketService';
import { formatDateTime } from '../../utils/ticketHelpers';
import { getErrorMessage } from '../../utils/getErrorMessage';

const ROWS_PER_PAGE = 10;

const REQUEST_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const getRequestStatusBadgeClass = (status) => {
  const map = {
    PENDING: 'text-bg-warning',
    APPROVED: 'text-bg-success',
    REJECTED: 'text-bg-danger',
    CANCELLED: 'text-bg-light',
  };
  return map[status] || 'text-bg-light';
};

function TransferRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [tab, setTab] = useState('received');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [page, setPage] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isReceivedTab = tab === 'received';

  const loadRequests = async (nextPage = 1) => {
    const safePage = Number.isFinite(Number(nextPage)) && Number(nextPage) > 0 ? Number(nextPage) : 1;
    setIsLoading(true);
    setPageError('');
    setItems([]);

    try {
      const params = { page: nextPage, limit: ROWS_PER_PAGE };
      const response = isReceivedTab ? await getReceivedTicketTransferRequests(params) : await getSentTicketTransferRequests(params);

      setItems(response?.data ?? []);
      setMeta(response?.meta ?? null);
      setPage(safePage);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load transfer requests.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.id]);

  const executeDecision = async ({ requestId, decision }) => {
    if (!requestId) return;

    if (decision === 'approve') {
      const approved = await confirm({
        title: 'Approve Transfer',
        message: 'Approve this transfer request and move the ticket to the requester?',
        confirmText: 'Approve',
        variant: 'success',
      });
      if (!approved) return;
    }

    if (decision === 'reject') {
      const rejected = await confirm({
        title: 'Reject Transfer',
        message: 'Reject this transfer request?',
        confirmText: 'Reject',
        variant: 'danger',
      });
      if (!rejected) return;
    }

    setIsActionLoading(true);
    setPageError('');

    try {
      if (decision === 'approve') {
        await approveTicketTransferRequest(requestId, {});
        toast.success('Transfer request approved.');
      } else {
        await rejectTicketTransferRequest(requestId, {});
        toast.success('Transfer request rejected.');
      }

      await loadRequests(page);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to complete this request decision.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (tab === 'sent') return 'Requests you sent to other helpdesk agents.';
    return 'Requests sent to you by other helpdesk agents.';
  }, [tab]);

  const title = 'Ticket Transfer Requests';

  return (
    <>
      <PageHeader
        title={title}
        subtitle={headerSubtitle}
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn btn-sm ${tab === 'received' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTab('received')}
              disabled={isActionLoading}
            >
              Received
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tab === 'sent' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTab('sent')}
              disabled={isActionLoading}
            >
              Sent
            </button>
          </div>
        }
      />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}

      {isLoading ? (
        <LoadingCard message="Loading transfer requests..." />
      ) : items.length ? (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket</th>
                    <th>From / To</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((req) => {
                    const from = req?.requester?.fullName || 'Unknown';
                    const to = req?.targetAgent?.fullName || 'Unknown';
                    const fromToLabel = isReceivedTab ? `From: ${from}` : `To: ${to}`;

                    const canDecide = isReceivedTab && req?.status === 'PENDING' && !isActionLoading;

                    return (
                      <tr key={req.id}>
                        <td>
                          <div className="fw-semibold text-dark">{req.ticketNumber}</div>
                          <div className="text-secondary small">{req.ticketTitle || 'Not available'}</div>
                        </td>
                        <td>{fromToLabel}</td>
                        <td>
                          <span className={`badge rounded-pill ${getRequestStatusBadgeClass(req.status)}`}>
                            {REQUEST_STATUS_LABELS[req.status] || req.status || 'Unknown'}
                          </span>
                        </td>
                        <td>{req.createdAt ? formatDateTime(req.createdAt) : 'Not available'}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2 flex-wrap">
                            <Link to={`/tickets/${req.ticketNumber}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                            {isReceivedTab ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  disabled={!canDecide}
                                  onClick={() => executeDecision({ requestId: req.id, decision: 'approve' })}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={!canDecide}
                                  onClick={() => executeDecision({ requestId: req.id, decision: 'reject' })}
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-md-none">
            <div className="vstack gap-3 p-3">
              {items.map((req) => {
                const from = req?.requester?.fullName || 'Unknown';
                const to = req?.targetAgent?.fullName || 'Unknown';
                const fromToLabel = isReceivedTab ? `From: ${from}` : `To: ${to}`;
                const canDecide = isReceivedTab && req?.status === 'PENDING' && !isActionLoading;

                return (
                  <div key={req.id} className="card border shadow-sm entity-mobile-card">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="fw-semibold text-dark">{req.ticketNumber}</div>
                          <div className="text-secondary small text-break">{req.ticketTitle || 'Not available'}</div>
                        </div>
                        <span className={`badge rounded-pill flex-shrink-0 ${getRequestStatusBadgeClass(req.status)}`}>
                          {REQUEST_STATUS_LABELS[req.status] || req.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="vstack gap-2 small entity-mobile-fields">
                        <div>
                          <div className="entity-mobile-field-label">{isReceivedTab ? 'From' : 'To'}</div>
                          <div className="text-break text-dark">{isReceivedTab ? from : to}</div>
                        </div>
                        <div>
                          <div className="entity-mobile-field-label">Requested</div>
                          <div className="text-dark">{req.createdAt ? formatDateTime(req.createdAt) : 'Not available'}</div>
                        </div>
                      </div>
                      <div className="d-grid gap-2 mt-3 pt-3 border-top">
                        <Link to={`/tickets/${req.ticketNumber}`} className="btn btn-sm btn-outline-primary">
                          View ticket
                        </Link>
                        {isReceivedTab ? (
                          <div className="row g-2">
                            <div className="col-6">
                              <button
                                type="button"
                                className="btn btn-sm btn-success w-100"
                                disabled={!canDecide}
                                onClick={() => executeDecision({ requestId: req.id, decision: 'approve' })}
                              >
                                Approve
                              </button>
                            </div>
                            <div className="col-6">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger w-100"
                                disabled={!canDecide}
                                onClick={() => executeDecision({ requestId: req.id, decision: 'reject' })}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-3 px-md-4 pb-4">
            <PaginationControls meta={meta} onPageChange={(next) => loadRequests(next)} />
          </div>
        </div>
      ) : (
        <EmptyState
          title={tab === 'sent' ? 'No sent requests' : 'No received requests'}
          description={tab === 'sent' ? 'You have not sent any transfer requests yet.' : 'You have no transfer requests to review.'}
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

export default TransferRequestsPage;

