import { PRIORITY_LABELS, STATUS_LABELS, getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/ticketHelpers';

function TicketStatusBadge({ status, priority }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {status ? <span className={`badge rounded-pill ${getStatusBadgeClass(status)}`}>{STATUS_LABELS[status] || status}</span> : null}
      {priority ? (
        <span className={`badge rounded-pill ${getPriorityBadgeClass(priority)}`}>{PRIORITY_LABELS[priority] || priority}</span>
      ) : null}
    </div>
  );
}

export default TicketStatusBadge;
