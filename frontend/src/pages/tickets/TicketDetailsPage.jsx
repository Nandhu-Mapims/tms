import { useEffect, useState } from 'react';
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
import {
  addTicketAttachmentRequest,
  addTicketCommentRequest,
  closeTicketRequest,
  escalateTicketRequest,
  getTicketActivityLogRequest,
  getTicketAttachmentsRequest,
  getTicketByIdRequest,
  getTicketCommentsRequest,
  reopenTicketRequest,
  resolveTicketRequest,
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
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  if (user?.role !== 'REQUESTER') {
    actions.push(
      <button
        key="open"
        type="button"
        className="btn btn-outline-secondary"
        disabled={isActionLoading}
        onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'OPEN' }), successMessage: 'Ticket marked open.' })}
      >
        Mark Open
      </button>
    );

    actions.push(
      <button
        key="inprogress"
        type="button"
        className="btn btn-outline-secondary"
        disabled={isActionLoading}
        onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'IN_PROGRESS' }), successMessage: 'Ticket moved to in progress.' })}
      >
        Mark In Progress
      </button>
    );

    actions.push(
      <button
        key="hold"
        type="button"
        className="btn btn-outline-secondary"
        disabled={isActionLoading}
        onClick={() => executeAction({ action: () => updateTicketStatusRequest(id, { status: 'ON_HOLD' }), successMessage: 'Ticket placed on hold.' })}
      >
        Put On Hold
      </button>
    );
  }

  if (canResolveTicket(user?.role, ticket, user?.id)) {
    actions.push(
      <button
        key="resolve"
        type="button"
        className="btn btn-outline-success"
        disabled={isActionLoading}
        onClick={() => executeAction({
          action: () => resolveTicketRequest(id, { resolutionNote: 'Resolved from ticket detail page.' }),
          successMessage: 'Ticket resolved successfully.',
          confirmOptions: {
            title: 'Resolve Ticket',
            message: 'Mark this ticket as resolved now?',
            confirmText: 'Resolve',
            variant: 'primary',
          },
        })}
      >
        Resolve
      </button>
    );
  }

  if (canCloseTicket(user?.role)) {
    actions.push(
      <button
        key="close"
        type="button"
        className="btn btn-success"
        disabled={isActionLoading || ticket.status !== 'RESOLVED'}
        onClick={() => executeAction({
          action: () => closeTicketRequest(id),
          successMessage: 'Ticket closed successfully.',
          confirmOptions: {
            title: 'Close Ticket',
            message: 'Close this resolved ticket? Further edits will require reopening.',
            confirmText: 'Close Ticket',
            variant: 'warning',
          },
        })}
      >
        Close
      </button>
    );
  }

  if (canReopenTicket(user?.role)) {
    actions.push(
      <button
        key="reopen"
        type="button"
        className="btn btn-warning"
        disabled={isActionLoading || ticket.status !== 'CLOSED'}
        onClick={() => executeAction({
          action: () => reopenTicketRequest(id),
          successMessage: 'Ticket reopened successfully.',
          confirmOptions: {
            title: 'Reopen Ticket',
            message: 'Reopen this closed ticket and return it to active workflow?',
            confirmText: 'Reopen',
            variant: 'warning',
          },
        })}
      >
        Reopen
      </button>
    );
  }

  if (canEscalateTicket(user?.role)) {
    actions.push(
      <button
        key="escalate"
        type="button"
        className="btn btn-danger"
        disabled={isActionLoading || !ticket.isOverdue}
        onClick={() => executeAction({
          action: () => escalateTicketRequest(id, { remarks: 'Escalated from ticket detail page.' }),
          successMessage: 'Ticket escalated successfully.',
          confirmOptions: {
            title: 'Escalate Ticket',
            message: 'This ticket is overdue. Escalate it now?',
            confirmText: 'Escalate',
            variant: 'danger',
          },
        })}
      >
        Escalate
      </button>
    );
  }

  return (
    <>
      <PageHeader title={ticket.ticketNumber} subtitle={ticket.title} actions={actions} />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}

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


