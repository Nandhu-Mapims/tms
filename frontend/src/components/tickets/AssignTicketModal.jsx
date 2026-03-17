import { useEffect, useState } from 'react';
import { validatePositiveInteger } from '../../utils/validators';

function AssignTicketModal({ show, ticket, onClose, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({
    assignedTeam: '',
    assignedToId: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormState({
      assignedTeam: ticket?.assignedTeam || '',
      assignedToId: ticket?.assignedToId || '',
    });
    setErrorMessage('');
  }, [ticket]);

  if (!show) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(formState.assignedTeam).trim() && !String(formState.assignedToId).trim()) {
      setErrorMessage('Provide at least an assigned team or a technician user ID.');
      return;
    }

    if (String(formState.assignedToId).trim()) {
      const userIdError = validatePositiveInteger(formState.assignedToId, 'Technician User ID');
      if (userIdError) {
        setErrorMessage(userIdError);
        return;
      }
    }

    setErrorMessage('');
    await onSubmit({
      assignedTeam: formState.assignedTeam.trim(),
      assignedToId: formState.assignedToId ? Number(formState.assignedToId) : null,
    });
  };

  return (
    <div className="modal fade show d-block modal-backdrop-soft" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title fs-5">{ticket?.assignedToId ? 'Reassign Ticket' : 'Assign Ticket'}</h2>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body d-grid gap-3">
              <div>
                <label className="form-label">Assigned Team</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.assignedTeam}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, assignedTeam: event.target.value }));
                    setErrorMessage('');
                  }}
                  placeholder="IT Field Support / Biomedical / Facilities"
                />
              </div>
              <div>
                <label className="form-label">Technician User ID</label>
                <input
                  type="number"
                  min="1"
                  className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                  value={formState.assignedToId}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, assignedToId: event.target.value }));
                    setErrorMessage('');
                  }}
                  placeholder="Enter technician user ID"
                />
                {errorMessage ? <div className="invalid-feedback">{errorMessage}</div> : null}
                <div className="form-text">
                  Backend does not yet expose a technician directory endpoint, so assignment uses the user ID.
                </div>
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
