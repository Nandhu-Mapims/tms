import { Link } from 'react-router-dom';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import { getTimeTakenLabel } from '../../utils/ticketHelpers';

function TicketTable({ tickets, userId = '', userRole = '', onCancelRequest = null, isCancelling = false }) {
  const normalizedUserId = String(userId ?? '');
  const isAdmin = String(userRole ?? '') === 'ADMIN';
  const showHandlingAndRequester = isAdmin;

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Ticket</th>
              {showHandlingAndRequester ? <th>Handling Department</th> : <th>Requester Department</th>}
              {showHandlingAndRequester ? <th>Requester Department</th> : null}
              <th>Requester</th>
              <th>Handled By</th>
              <th>Transfer</th>
              <th>Status</th>
              <th>Time Taken</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <div className="fw-semibold text-dark">{ticket.ticketNumber}</div>
                  <div className="text-secondary small">{ticket.title}</div>
                </td>
                {showHandlingAndRequester ? (
                  <td>{ticket.department?.name || 'Not available'}</td>
                ) : (
                  <td>{ticket.requesterDepartment?.name || ticket.department?.name || 'Not available'}</td>
                )}
                {showHandlingAndRequester ? (
                  <td>{ticket.requesterDepartment?.name || ticket.department?.name || 'Not available'}</td>
                ) : null}
                <td>{ticket.requester?.fullName || 'Not available'}</td>
                <td>{ticket.assignedTo?.fullName || 'Unassigned'}</td>
                <td>
                  {ticket.transferRequestsPending?.length ? (
                    <span className="badge text-bg-warning text-wrap text-start">
                      Pending: {ticket.transferRequestsPending.length} request
                      {ticket.transferRequestsPending.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-secondary small">—</span>
                  )}
                </td>
                <td>
                  <TicketStatusBadge status={ticket.status} priority={ticket.priority} />
                </td>
                <td>
                  <div>{getTimeTakenLabel(ticket)}</div>
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <Link to={`/tickets/${ticket.ticketNumber}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                    {onCancelRequest &&
                    normalizedUserId &&
                    String(ticket?.requesterId ?? '') === normalizedUserId &&
                    ['NEW', 'OPEN'].includes(String(ticket?.status ?? '')) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={isCancelling}
                        onClick={() => onCancelRequest(ticket)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketTable;
