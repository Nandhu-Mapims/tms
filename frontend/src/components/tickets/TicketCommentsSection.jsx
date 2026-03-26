import { useState } from 'react';
import { canUseInternalComments, formatDateTime } from '../../utils/ticketHelpers';

/**
 * @param {'public' | 'internal'} mode — public comments vs staff-only internal chat
 */
function TicketCommentsSection({ mode = 'public', comments, userRole, onSubmit, isSubmitting, canPost = true }) {
  const isPublic = mode === 'public';
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const title = isPublic ? 'Public comments' : 'Chat';
  const hint = isPublic
    ? 'Anyone with access to this ticket can read and post here.'
    : 'Visible to all users who can access this ticket. Chat history is preserved across transfers.';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      setErrorMessage(isPublic ? 'Comment cannot be empty.' : 'Message cannot be empty.');
      return;
    }

    setErrorMessage('');
    await onSubmit({ comment: comment.trim(), isInternal: !isPublic });
    setComment('');
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <div>
            <h2 className="h5 mb-0">{title}</h2>
            <p className="small text-secondary mb-0 mt-1">{hint}</p>
          </div>
          <span className="badge text-bg-light flex-shrink-0">{comments.length}</span>
        </div>

        {canPost ? (
          <form onSubmit={handleSubmit} className="d-grid gap-3 mt-3 mb-4" noValidate>
            <textarea
              className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
              rows={isPublic ? 3 : 2}
              placeholder={isPublic ? 'Add a public comment…' : 'Staff message…'}
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />
            {errorMessage ? <div className="invalid-feedback d-block">{errorMessage}</div> : null}
            <div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : isPublic ? 'Post comment' : 'Send'}
              </button>
            </div>
          </form>
        ) : (
          <div className="border rounded-4 p-3 mt-3 mb-4 text-secondary small">
            {isPublic
              ? 'You can read this thread but do not have permission to add comments on this ticket.'
              : canUseInternalComments(userRole)
                ? 'Only the requester and current handler can post in this chat. Others can still read the full history.'
                : 'Only the requester and current handler can post in this chat. You can still read the full history.'}
          </div>
        )}

        <div className="d-grid gap-3">
          {comments.length ? (
            comments.map((item) => (
              <div key={item.id} className={`border rounded-4 p-3 ${!isPublic ? 'border-warning border-opacity-50' : ''}`}>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <div>
                    <div className="fw-semibold">{item.user?.fullName || 'User'}</div>
                    <div className="small text-secondary">{item.user?.role || 'Role unavailable'}</div>
                  </div>
                  <div className="text-end">
                    {!isPublic ? <span className="badge text-bg-warning mb-1">Internal</span> : null}
                    <div className="small text-secondary">{formatDateTime(item.createdAt)}</div>
                  </div>
                </div>
                <p className="mb-0 text-secondary">{item.comment}</p>
              </div>
            ))
          ) : (
            <div className="border rounded-4 p-3 text-secondary small">{isPublic ? 'No public comments yet.' : 'No staff messages yet.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketCommentsSection;
