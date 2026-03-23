import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import TicketActivityTimeline from '../../components/tickets/TicketActivityTimeline.jsx';
import TicketAttachmentsSection from '../../components/tickets/TicketAttachmentsSection.jsx';
import TicketCommentsSection from '../../components/tickets/TicketCommentsSection.jsx';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { getAssignableUsersRequest } from '../../services/authService';
import {
  addTicketAttachmentRequest,
  addTicketCommentRequest,
  claimTicketRequest,
  closeTicketRequest,
  confirmResolutionRequest,
  escalateTicketRequest,
  getTicketActivityLogRequest,
  getTicketAttachmentsRequest,
  getTicketByIdRequest,
  getTicketCommentsRequest,
  reopenTicketRequest,
  resolveTicketRequest,
  transferTicketRequest,
  createTicketTransferRequest,
  updateTicketStatusRequest,
} from '../../services/ticketService';
import {
  canCloseTicket,
  canEscalateTicket,
  canReopenTicket,
  canResolveTicket,
  formatDateTime,
  getTimeTakenLabel,
} from '../../utils/ticketHelpers';
import { getErrorMessage } from '../../utils/getErrorMessage';

const CHAT_POLL_INTERVAL_MS = 10_000;

function TicketDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const isLeadershipRole = user?.role === 'HOD' || user?.role === 'ADMIN';
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const [transferState, setTransferState] = useState({
    open: false,
    isLoading: false,
    errorMessage: '',
    users: [],
    assignedToId: '',
    note: '',
  });

  const loadTicketDetails = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    setPageError('');

    try {
      const [ticketResponse, commentsResponse, attachmentsResponse, activityResponse] = await Promise.all([
        getTicketByIdRequest(id),
        getTicketCommentsRequest(id),
        getTicketAttachmentsRequest(id),
        getTicketActivityLogRequest(id),
      ]);

      const ticketData = ticketResponse.data;
      setTicket(ticketData ? { ...ticketData, timeTakenLabel: getTimeTakenLabel(ticketData) } : null);
      setComments(commentsResponse.data);
      setAttachments(attachmentsResponse.data);
      setActivities(activityResponse.data);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load ticket details.');
      setPageError(message);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTicketDetails();
  }, [id]);

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const handlePointerDown = (event) => {
      const root = moreRef.current;
      if (!root) return;
      if (root.contains(event.target)) return;
      setIsMoreOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let isCancelled = false;

    const poll = async () => {
      try {
        const [commentsResponse, activityResponse] = await Promise.all([
          getTicketCommentsRequest(id),
          getTicketActivityLogRequest(id),
        ]);

        if (isCancelled) {
          return;
        }

        setComments(commentsResponse.data);
        setActivities(activityResponse.data);
      } catch {
        // Fail silently — chat polling is non-critical.
      }
    };

    const intervalId = window.setInterval(poll, CHAT_POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id]);

  const executeAction = async ({ action, successMessage, confirmOptions }) => {
    if (confirmOptions) {
      const approved = await confirm(confirmOptions);
      if (!approved) {
        return;
      }
    }

    setIsActionLoading(true);
    setPageError('');

    try {
      await action();
      await loadTicketDetails(false);
      toast.success(successMessage);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to complete this ticket action.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openTransferModal = async () => {
    setIsMoreOpen(false);
    setTransferState((prev) => ({ ...prev, open: true, isLoading: true, errorMessage: '' }));
    try {
      const response = await getAssignableUsersRequest();
      const users = response?.data ?? [];
      setTransferState((prev) => ({
        ...prev,
        isLoading: false,
        users,
        assignedToId: prev.assignedToId || '',
      }));
    } catch (error) {
      setTransferState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: getErrorMessage(error, 'Unable to load helpdesk agents.'),
      }));
    }
  };

  const closeTransferModal = () => {
    setTransferState((prev) => ({ ...prev, open: false, errorMessage: '' }));
  };

  const submitTransfer = async () => {
    const assignedToId = String(transferState.assignedToId ?? '').trim();
    if (!assignedToId) {
      setTransferState((prev) => ({ ...prev, errorMessage: 'Select a helpdesk agent to transfer.' }));
      return;
    }

    await executeAction({
      action: () => transferTicketRequest(id, { assignedToId, note: transferState.note }),
      successMessage: isLeadershipRole ? 'Ticket assigned to helpdesk successfully.' : 'Ticket transferred successfully.',
      confirmOptions: isLeadershipRole
        ? {
            title: 'Assign to helpdesk',
            message: 'Assign this ticket directly to the selected helpdesk agent? (No transfer request needed.)',
            confirmText: 'Assign',
            variant: 'primary',
          }
        : {
            title: 'Transfer Ticket',
            message: 'Transfer this ticket to the selected helpdesk agent?',
            confirmText: 'Transfer',
            variant: 'warning',
          },
    });

    closeTransferModal();
  };

  const handleAddComment = async (payload) => {
    setIsCommentSubmitting(true);

    try {
      await addTicketCommentRequest(id, payload);
      const [response, activityResponse] = await Promise.all([
        getTicketCommentsRequest(id),
        getTicketActivityLogRequest(id),
      ]);
      setComments(response.data);
      setActivities(activityResponse.data);
      toast.success('Comment added successfully.');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to add comment.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);

    try {
      await addTicketAttachmentRequest(id, file);
      const [attachmentResponse, activityResponse] = await Promise.all([
        getTicketAttachmentsRequest(id),
        getTicketActivityLogRequest(id),
      ]);
      setAttachments(attachmentResponse.data);
      setActivities(activityResponse.data);
      toast.success('Attachment uploaded successfully.');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to upload attachment.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <LoadingCard message="Loading ticket details..." />;
  }

  if (!ticket) {
    return (
      <EmptyState
        title={pageError ? 'Unable to open ticket' : 'Ticket not found'}
        description={pageError || 'The requested ticket could not be loaded.'}
        action={
          <Link to="/tickets" className="btn btn-primary">
            Back to Tickets
          </Link>
        }
      />
    );
  }

  const actions = [
    <Link key="back" to="/tickets" className="btn btn-outline-secondary">
      Back to List
    </Link>,
  ];

  const isStaff = user?.role !== 'REQUESTER';
  const canResolve = canResolveTicket(user?.role);
  const requiresAssignmentForRole = user?.role === 'HELPDESK';
  const isAssignedToCurrentUser = String(ticket?.assignedToId ?? '') === String(user?.id ?? '');
  const canResolveForUser = Boolean(canResolve && (!requiresAssignmentForRole || isAssignedToCurrentUser));
  const canClose = canCloseTicket(user?.role);
  const canCloseForUser = Boolean(canClose && (!requiresAssignmentForRole || isAssignedToCurrentUser));
  const isTicketRequester = String(ticket?.requesterId ?? '') === String(user?.id ?? '');
  const canAdminForceCloseResolved =
    user?.role === 'ADMIN' && canCloseForUser && ticket?.status === 'RESOLVED';
  const canConfirmResolutionClose = isTicketRequester && ticket?.status === 'RESOLVED';
  const canReopen = canReopenTicket(user?.role);
  const canReopenForUser = Boolean(canReopen && (!requiresAssignmentForRole || isAssignedToCurrentUser));
  const canEscalate = canEscalateTicket(user?.role);
  const canTransferForUser = !requiresAssignmentForRole || (Boolean(ticket?.assignedToId) && isAssignedToCurrentUser);
  const canUpdateStatusForUser = !requiresAssignmentForRole || !ticket?.assignedToId || isAssignedToCurrentUser;
  const isResolvedState = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket?.status);

  const primaryActions = [];
  const secondaryActions = [];

  if (isStaff && !ticket?.assignedToId) {
    primaryActions.push(
      <button
        key="claim"
        type="button"
        className="btn btn-primary"
        disabled={isActionLoading}
        onClick={() => executeAction({ action: () => claimTicketRequest(id), successMessage: 'Ticket assigned to you.' })}
      >
        Claim
      </button>
    );
  }

  if (isLeadershipRole && canTransferForUser && !isResolvedState) {
    primaryActions.push(
      <button
        key="hod-assign-helpdesk"
        type="button"
        className="btn btn-primary"
        disabled={isActionLoading}
        onClick={openTransferModal}
      >
        Assign to helpdesk
      </button>
    );
  }

  const canRequestTransferToMe =
    user?.role === 'HELPDESK' &&
    Boolean(ticket?.assignedToId) &&
    ticket?.assignedTo?.role === 'HELPDESK' &&
    !isAssignedToCurrentUser &&
    !isResolvedState;

  if (canRequestTransferToMe) {
    primaryActions.push(
      <button
        key="request-transfer"
        type="button"
        className="btn btn-outline-primary"
        disabled={isActionLoading}
        onClick={() =>
          executeAction({
            action: () => createTicketTransferRequest(id, {}),
            successMessage: 'Transfer request sent.',
            confirmOptions: {
              title: 'Request Transfer',
              message: 'Request the assigned helpdesk agent to transfer this ticket to you?',
              confirmText: 'Send Request',
              variant: 'primary',
            },
          })
        }
      >
        Request Transfer
      </button>
    );
  }

  if (canResolveForUser && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED') {
    primaryActions.push(
      <button
        key="resolve"
        type="button"
        className="btn btn-success"
        disabled={isActionLoading}
        onClick={() =>
          executeAction({
            action: () => resolveTicketRequest(id, { resolutionNote: 'Resolved from ticket detail page.' }),
            successMessage: 'Ticket resolved. The requester must confirm before it is fully closed.',
            confirmOptions: {
              title: 'Resolve Ticket',
              message: 'Mark this ticket as resolved? The requester will need to confirm before the ticket can be fully closed.',
              confirmText: 'Resolve',
              variant: 'primary',
            },
          })
        }
      >
        Resolve
      </button>
    );
  }

  if (canConfirmResolutionClose) {
    primaryActions.push(
      <button
        key="confirm-resolution"
        type="button"
        className="btn btn-success"
        disabled={isActionLoading}
        onClick={() =>
          executeAction({
            action: () => confirmResolutionRequest(id, {}),
            successMessage: 'Thank you. The ticket is now closed.',
            confirmOptions: {
              title: 'Confirm resolution',
              message: 'Confirm that the issue is fixed? This will fully close the ticket.',
              confirmText: 'Yes, close ticket',
              variant: 'primary',
            },
          })
        }
      >
        Confirm fix & close
      </button>
    );
  }

  if (canAdminForceCloseResolved) {
    primaryActions.push(
      <button
        key="close"
        type="button"
        className="btn btn-outline-success"
        disabled={isActionLoading}
        onClick={() =>
          executeAction({
            action: () => closeTicketRequest(id),
            successMessage: 'Ticket closed successfully.',
            confirmOptions: {
              title: 'Close Ticket (admin)',
              message: 'Close this ticket without requester confirmation? Use only when appropriate.',
              confirmText: 'Close Ticket',
              variant: 'warning',
            },
          })
        }
      >
        Close (admin override)
      </button>
    );
  }

  if (canReopenForUser) {
    secondaryActions.push(
      <button
        key="reopen"
        type="button"
        className="dropdown-item"
        disabled={isActionLoading || ticket.status !== 'CLOSED'}
        onClick={() =>
          executeAction({
            action: () => reopenTicketRequest(id),
            successMessage: 'Ticket reopened successfully.',
            confirmOptions: {
              title: 'Reopen Ticket',
              message: 'Reopen this closed ticket and return it to active workflow?',
              confirmText: 'Reopen',
              variant: 'warning',
            },
          })
        }
      >
        Reopen
      </button>
    );
  }

  if (isStaff) {
    if (canUpdateStatusForUser) {
      secondaryActions.push(
        <button
          key="open"
          type="button"
          className="dropdown-item"
          disabled={isActionLoading}
          onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'OPEN' }), successMessage: 'Ticket marked open.' })}
        >
          Mark Open
        </button>
      );

      secondaryActions.push(
        <button
          key="inprogress"
          type="button"
          className="dropdown-item"
          disabled={isActionLoading}
          onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'IN_PROGRESS' }), successMessage: 'Ticket moved to in progress.' })}
        >
          Mark In Progress
        </button>
      );

      secondaryActions.push(
        <button
          key="hold"
          type="button"
          className="dropdown-item"
          disabled={isActionLoading}
          onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'ON_HOLD' }), successMessage: 'Ticket placed on hold.' })}
        >
          Put On Hold
        </button>
      );
    }

    if (canTransferForUser && !isLeadershipRole) {
      secondaryActions.push(
        <button
          key="transfer"
          type="button"
          className="dropdown-item"
          disabled={isActionLoading}
          onClick={openTransferModal}
        >
          Transfer to agent
        </button>
      );
    }
  }

  if (canEscalate) {
    secondaryActions.push(
      <button
        key="escalate"
        type="button"
        className="dropdown-item text-danger"
        disabled={isActionLoading || !ticket.isOverdue}
        onClick={() =>
          executeAction({
            action: () => escalateTicketRequest(id, { remarks: 'Escalated from ticket detail page.' }),
            successMessage: 'Ticket escalated successfully.',
            confirmOptions: {
              title: 'Escalate Ticket',
              message: 'This ticket is overdue. Escalate it now?',
              confirmText: 'Escalate',
              variant: 'danger',
            },
          })
        }
      >
        Escalate
      </button>
    );
  }

  actions.push(...primaryActions);

  if (secondaryActions.length) {
    const menu = (
      <div className={`dropdown-menu dropdown-menu-end ${isMoreOpen ? 'show' : ''}`}>
        {secondaryActions.map((node) => {
          if (!isValidElement(node)) return node;
          const originalOnClick = node.props?.onClick;
          return cloneElement(node, {
            onClick: async (...args) => {
              setIsMoreOpen(false);
              return originalOnClick?.(...args);
            },
          });
        })}
      </div>
    );

    actions.push(
      <div key="more" className="dropdown" ref={moreRef}>
        <button
          type="button"
          className="btn btn-outline-secondary dropdown-toggle"
          aria-expanded={isMoreOpen}
          disabled={isActionLoading}
          onClick={() => setIsMoreOpen((prev) => !prev)}
        >
          More
        </button>
        {menu}
      </div>
    );
  }

  return (
    <>
      <PageHeader title={ticket.ticketNumber} subtitle={ticket.title} actions={actions} />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}
      {ticket.status === 'RESOLVED' && isTicketRequester ? (
        <div className="alert alert-info mb-3">
          Support has marked this ticket <strong>resolved</strong>. If the issue is fixed, use <strong>Confirm fix & close</strong> to fully close it.
        </div>
      ) : null}
      {ticket.status === 'RESOLVED' && isStaff && !isTicketRequester ? (
        <div className="alert alert-secondary mb-3">
          This ticket is resolved and waiting for the <strong>requester</strong> to confirm before it can be fully closed.
        </div>
      ) : null}

      {transferState.open ? (
        <div className="modal fade show d-block modal-backdrop-soft" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h2 className="modal-title fs-5">{isLeadershipRole ? 'Assign ticket to helpdesk' : 'Transfer Ticket'}</h2>
                <button type="button" className="btn-close" onClick={closeTransferModal}></button>
              </div>
              <div className="modal-body">
                {transferState.errorMessage ? <div className="alert alert-danger">{transferState.errorMessage}</div> : null}
                <div className="row g-3">
                  <div className="col-12 col-md-7">
                    <label className="form-label">
                      Helpdesk agent <span className="text-danger ms-1">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={transferState.assignedToId}
                      disabled={transferState.isLoading}
                      onChange={(e) => setTransferState((prev) => ({ ...prev, assignedToId: e.target.value, errorMessage: '' }))}
                    >
                      <option value="">{transferState.isLoading ? 'Loading agents...' : 'Select helpdesk agent'}</option>
                      {transferState.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} {u.email ? `(${u.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-5">
                    <label className="form-label">Note (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={transferState.note}
                      onChange={(e) => setTransferState((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder={isLeadershipRole ? 'Optional note for assignment' : 'Reason for transfer'}
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeTransferModal} disabled={isActionLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={submitTransfer} disabled={isActionLoading || transferState.isLoading}>
                  {isActionLoading ? (isLeadershipRole ? 'Assigning...' : 'Transferring...') : isLeadershipRole ? 'Assign' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h2 className="h5 fw-semibold mb-2">Ticket Overview</h2>
                  <p className="text-secondary mb-0">{ticket.description}</p>
                </div>
                <TicketStatusBadge status={ticket.status} priority={ticket.priority} />
              </div>

              <div className="row g-3 small">
                <div className="col-md-6">
                  <span className="text-secondary d-block">Department</span>
                  <span className="fw-semibold">{ticket.department?.name || 'Not available'}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Category</span>
                  <span className="fw-semibold">
                    {ticket.category?.name || 'Not available'} / {ticket.subcategory?.name || 'Not available'}
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Location</span>
                  <span className="fw-semibold">
                    {[ticket.location?.block, ticket.location?.floor, ticket.location?.ward, ticket.location?.room]
                      .filter(Boolean)
                      .join(' / ') || 'Not available'}
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Telecom Number</span>
                  <span className="fw-semibold">{ticket.telecomNumber || 'Not available'}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Handled By</span>
                  <span className="fw-semibold">{ticket.assignedTo?.fullName || 'Unassigned'}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Assigned Team</span>
                  <span className="fw-semibold">{ticket.assignedTeam || 'Not assigned'}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Created</span>
                  <span className="fw-semibold">{formatDateTime(ticket.createdAt)}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Time Taken</span>
                  <span className="fw-semibold">{ticket.timeTakenLabel || 'In progress'}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Resolved At</span>
                  <span className="fw-semibold">{formatDateTime(ticket.resolvedAt)}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary d-block">Closed At</span>
                  <span className="fw-semibold">{formatDateTime(ticket.closedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 fw-semibold mb-3">SLA Snapshot</h2>
              <div className="d-grid gap-3">
                <div className="border rounded-4 p-3">
                  <div className="small text-secondary mb-1">Overdue</div>
                  <div className={`fw-bold ${ticket.isOverdue ? 'text-danger' : 'text-success'}`}>
                    {ticket.isOverdue ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="border rounded-4 p-3">
                  <div className="small text-secondary mb-1">First Response</div>
                  <div className="fw-bold">{formatDateTime(ticket.firstRespondedAt)}</div>
                </div>
                <div className="border rounded-4 p-3">
                  <div className="small text-secondary mb-1">Escalated At</div>
                  <div className="fw-bold">{formatDateTime(ticket.escalatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <TicketCommentsSection
            comments={comments}
            userRole={user?.role}
            onSubmit={handleAddComment}
            isSubmitting={isCommentSubmitting}
          />
        </div>
        <div className="col-12 col-xl-6">
          <TicketAttachmentsSection attachments={attachments} onUpload={handleUpload} isUploading={isUploading} />
        </div>
        <div className="col-12">
          <TicketActivityTimeline activities={activities} />
        </div>
      </div>

    </>
  );
}

export default TicketDetailsPage;


