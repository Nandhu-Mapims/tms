// Helpdesk sidebar: recent tickets assigned to you by HOD / Administrator (direct transfer).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAssignmentNoticesRequest } from '../../services/ticketService';
import { formatDateTime } from '../../utils/ticketHelpers';

const LEADERSHIP_ROLE_LABEL = {
  HOD: 'HOD',
  ADMIN: 'Administrator',
};

function SidebarAssignmentNotices() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user?.role !== 'HELPDESK') {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await getAssignmentNoticesRequest();
        if (cancelled) return;
        setItems(Array.isArray(response?.data) ? response.data : []);
      } catch {
        if (cancelled) return;
        setItems([]);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  if (user?.role !== 'HELPDESK' || !isLoaded || !items.length) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-top">
      <div className="small text-uppercase text-secondary fw-semibold mb-2">Assigned by leadership</div>
      <p className="small text-secondary mb-2">Tickets transferred to you by HOD or Administrator.</p>
      <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
        {items.map((n) => {
          const roleKey = n?.actorRole ?? '';
          const roleLabel = LEADERSHIP_ROLE_LABEL[roleKey] ?? 'Leadership';
          const ticketRef = n?.ticketNumber || n?.ticketId || '';

          return (
            <li key={n.id} className="border rounded-3 p-2 bg-light">
              <div className="fw-semibold text-dark text-truncate" title={n.ticketTitle ?? ''}>
                {n.ticketNumber || 'Ticket'}
              </div>
              <div className="text-secondary text-truncate" title={n.ticketTitle ?? ''}>
                {n.ticketTitle || '—'}
              </div>
              <div className="mt-1">
                <span className="text-secondary">By {roleLabel}: </span>
                <span className="fw-medium">{n.actorName || 'Staff'}</span>
              </div>
              <div className="text-secondary mt-1">{n.createdAt ? formatDateTime(n.createdAt) : ''}</div>
              {ticketRef ? (
                <Link to={`/tickets/${ticketRef}`} className="btn btn-sm btn-outline-primary mt-2 w-100">
                  Open ticket
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SidebarAssignmentNotices;
