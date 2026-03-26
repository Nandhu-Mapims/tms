// Helpdesk sidebar: recent tickets assigned to you by HOD / Administrator (direct transfer).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAssignmentNoticesRequest } from '../../services/ticketService';

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

  const latest = items[0];
  const roleKey = latest?.actorRole ?? '';
  const roleLabel = LEADERSHIP_ROLE_LABEL[roleKey] ?? 'Leadership';

  return (
    <div className="border-top pt-3">
      <div className="small text-uppercase text-secondary fw-semibold mb-1">Assigned by leadership</div>
      <p className="small text-secondary mb-2" style={{ fontSize: '0.78rem' }}>
        {items.length} ticket(s) assigned by HOD/Administrator.
      </p>
      {latest ? (
        <p className="small text-secondary mb-2 text-truncate" title={`${latest.ticketNumber} · ${latest.actorName} (${roleLabel})`}>
          Latest: {latest.ticketNumber} by {latest.actorName} ({roleLabel})
        </p>
      ) : null}
      <div className="text-start">
        <Link to="/leadership-assignments" className="btn btn-sm btn-outline-primary w-100">
          Open leadership assignments
        </Link>
      </div>
    </div>
  );
}

export default SidebarAssignmentNotices;
