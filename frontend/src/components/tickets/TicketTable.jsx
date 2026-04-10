import { Link } from 'react-router-dom';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import { getTimeTakenLabel } from '../../utils/ticketHelpers';

function TicketTable({ tickets, userId = '', userRole = '', onCancelRequest = null, isCancelling = false }) {
  const normalizedUserId = String(userId ?? '');
  const isOrgWideViewer = ['ADMIN', 'CHIEF'].includes(String(userRole ?? ''));
  const showHandlingAndRequester = isOrgWideViewer;

  const renderTransferCell = (ticket) =>
    ticket.transferRequestsPending?.length ? (
      <span className="badge text-bg-warning text-wrap text-start">
        Pending: {ticket.transferRequestsPending.length} request{ticket.transferRequestsPending.length > 1 ? 's' : ''}
      </span>
    ) : (
      <span className="text-secondary small">—</span>
    );

  const renderActions = (ticket) => (
    <div className="d-inline-flex flex-wrap gap-2">
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
  );

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="d-none d-md-block">
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
                  <td>{renderTransferCell(ticket)}</td>
                  <td>
                    <TicketStatusBadge status={ticket.status} priority={ticket.priority} />
                  </td>
                  <td>
                    <div>{getTimeTakenLabel(ticket)}</div>
                  </td>
                  <td className="text-end">{renderActions(ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-md-none">
        <div className="vstack gap-3 p-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card border shadow-sm entity-mobile-card">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="fw-semibold text-dark">{ticket.ticketNumber}</div>
                    <div className="text-secondary small text-break">{ticket.title}</div>
                  </div>
                  <TicketStatusBadge status={ticket.status} priority={ticket.priority} />
                </div>
                <div className="vstack gap-2 small entity-mobile-fields">
                  {showHandlingAndRequester ? (
                    <>
                      <div>
                        <div className="entity-mobile-field-label">Handling Department</div>
                        <div className="text-break text-dark">{ticket.department?.name || 'Not available'}</div>
                      </div>
                      <div>
                        <div className="entity-mobile-field-label">Requester Department</div>
                        <div className="text-break text-dark">
                          {ticket.requesterDepartment?.name || ticket.department?.name || 'Not available'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="entity-mobile-field-label">Requester Department</div>
                      <div className="text-break text-dark">
                        {ticket.requesterDepartment?.name || ticket.department?.name || 'Not available'}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="entity-mobile-field-label">Requester</div>
                    <div className="text-dark">{ticket.requester?.fullName || 'Not available'}</div>
                  </div>
                  <div>
                    <div className="entity-mobile-field-label">Handled By</div>
                    <div className="text-dark">{ticket.assignedTo?.fullName || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div className="entity-mobile-field-label">Transfer</div>
                    <div>{renderTransferCell(ticket)}</div>
                  </div>
                  <div>
                    <div className="entity-mobile-field-label">Time Taken</div>
                    <div className="text-dark">{getTimeTakenLabel(ticket)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-top">{renderActions(ticket)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TicketTable;
