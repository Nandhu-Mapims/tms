import { useState } from 'react';
import { canUseInternalComments, formatDateTime } from '../../utils/ticketHelpers';

function TicketCommentsSection({ comments, userRole, onSubmit, isSubmitting }) {
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      setErrorMessage('Comment cannot be empty.');
      return;
    }

    setErrorMessage('');
    await onSubmit({ comment: comment.trim(), isInternal });
    setComment('');
    setIsInternal(false);
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">Comments</h2>
          <span className="badge text-bg-light">{comments.length}</span>
        </div>

        <form onSubmit={handleSubmit} className="d-grid gap-3 mb-4" noValidate>
          <textarea
            className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
            rows="3"
            placeholder="Add an operational update or requester-visible note"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
          />
          {errorMessage ? <div className="invalid-feedback d-block">{errorMessage}</div> : null}
          {canUseInternalComments(userRole) ? (
            <div className="form-check">
              <input
                id="internalComment"
                type="checkbox"
                className="form-check-input"
                checked={isInternal}
                onChange={(event) => setIsInternal(event.target.checked)}
              />
              <label htmlFor="internalComment" className="form-check-label">
                Internal note visible only to hospital staff roles
              </label>
            </div>
          ) : null}
          <div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Add Comment'}
            </button>
          </div>
        </form>

        <div className="d-grid gap-3">
          {comments.length ? comments.map((item) => (
            <div key={item.id} className="border rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <div className="fw-semibold">{item.user?.fullName || 'User'}</div>
                  <div className="small text-secondary">{item.user?.role || 'Role unavailable'}</div>
                </div>
                <div className="text-end">
                  {item.isInternal ? <span className="badge text-bg-warning mb-1">Internal</span> : null}
                  <div className="small text-secondary">{formatDateTime(item.createdAt)}</div>
                </div>
              </div>
              <p className="mb-0 text-secondary">{item.comment}</p>
            </div>
          )) : <div className="border rounded-4 p-3 text-secondary small">No comments added yet.</div>}
        </div>
      </div>
    </div>
  );
}

export default TicketCommentsSection;
