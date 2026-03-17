import { formatDateTime } from '../../utils/ticketHelpers';

function TicketActivityTimeline({ activities }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h2 className="h5 mb-4">Activity Log</h2>
        <div className="timeline">
          {activities.map((activity) => (
            <div key={activity.id} className="timeline-item pb-4">
              <div className="timeline-dot"></div>
              <div className="timeline-content border rounded-4 p-3">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <div>
                    <div className="fw-semibold">{activity.action.replaceAll('_', ' ')}</div>
                    <div className="small text-secondary">{activity.user?.fullName || 'System User'}</div>
                  </div>
                  <div className="small text-secondary">{formatDateTime(activity.createdAt)}</div>
                </div>
                {activity.remarks ? <p className="mb-2 text-secondary">{activity.remarks}</p> : null}
                {activity.oldValue || activity.newValue ? (
                  <div className="small">
                    {activity.oldValue ? <div className="text-secondary">Old: {activity.oldValue}</div> : null}
                    {activity.newValue ? <div className="text-secondary">New: {activity.newValue}</div> : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TicketActivityTimeline;
