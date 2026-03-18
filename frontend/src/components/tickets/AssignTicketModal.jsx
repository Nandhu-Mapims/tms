import { useEffect, useState } from 'react';
import { getAssignableUsersRequest } from '../../services/authService';

function AssignTicketModal({ show, ticket, onClose, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({
    assignedTeam: '',
    assignedToId: '',
  });
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormState({
      assignedTeam: ticket?.assignedTeam ?? '',
      assignedToId: ticket?.assignedToId ?? '',
    });
    setErrorMessage('');
  }, [ticket]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const loadAssignableUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await getAssignableUsersRequest();
        setAssignableUsers(response?.data ?? []);
      } catch {
        setAssignableUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    loadAssignableUsers();
  }, [show]);

  if (!show) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const team = String(formState.assignedTeam ?? '').trim();
    const userId =
      formState.assignedToId === '' || formState.assignedToId == null ? null : String(formState.assignedToId).trim();

    if (!team && !userId) {
      setErrorMessage('Provide at least an assigned team or select a user.');
      return;
    }

    setErrorMessage('');
    await onSubmit({
      assignedTeam: team,
      assignedToId: userId || null,
    });
  };

  return (
    <div className="modal fade show d-block modal-backdrop-soft" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title fs-5">{ticket?.assignedToId ? 'Reassign Ticket' : 'Assign Ticket'}</h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body d-grid gap-3">
              <div>
                <label className="form-label">Assigned Team</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.assignedTeam}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, assignedTeam: e.target.value }));
                    setErrorMessage('');
                  }}
                  placeholder="e.g. IT Field Support / Biomedical / Facilities"
                />
              </div>
              <div>
                <label className="form-label">Assign to User</label>
                {usersLoading ? (
                  <div className="form-control-plaintext small text-secondary">Loading users...</div>
                ) : assignableUsers.length > 0 ? (
                  <select
                    className={`form-select ${errorMessage ? 'is-invalid' : ''}`}
                    value={formState.assignedToId !== '' && formState.assignedToId != null ? String(formState.assignedToId) : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormState((prev) => ({ ...prev, assignedToId: val === '' ? '' : val }));
                      setErrorMessage('');
                    }}
                  >
                    <option value="">— Select user (optional) —</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                    value={formState.assignedToId ?? ''}
                    onChange={(e) => {
                      setFormState((prev) => ({ ...prev, assignedToId: e.target.value }));
                      setErrorMessage('');
                    }}
                    placeholder="Enter user id"
                  />
                )}
                {errorMessage ? <div className="invalid-feedback">{errorMessage}</div> : null}
                {assignableUsers.length === 0 && !usersLoading ? (
                  <div className="form-text">Select a user from the list or enter user id if you have it.</div>
                ) : null}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssignTicketModal;
