import { Link } from 'react-router-dom';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import { getTimeTakenLabel } from '../../utils/ticketHelpers';

function TicketTable({ tickets }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Ticket</th>
              <th>Department</th>
              <th>Requester</th>
              <th>Handled By</th>
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
                <td>{ticket.department?.name || 'Not available'}</td>
                <td>{ticket.requester?.fullName || 'Not available'}</td>
                <td>{ticket.assignedTo?.fullName || 'Unassigned'}</td>
                <td>
                  <TicketStatusBadge status={ticket.status} priority={ticket.priority} />
                </td>
                <td>
                  <div>{getTimeTakenLabel(ticket)}</div>
                </td>
                <td className="text-end">
                  <Link to={`/tickets/${ticket.ticketNumber}`} className="btn btn-sm btn-outline-primary">
                    View
                  </Link>
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
