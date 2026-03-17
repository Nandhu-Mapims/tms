function ConfirmDialog({ open, title, message, confirmText, cancelText, variant, onConfirm, onCancel }) {
  if (!open) {
    return null;
  }

  const buttonClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

  return (
    <div className="modal fade show d-block modal-backdrop-soft" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h2 className="modal-title fs-5">{title}</h2>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p className="mb-0 text-secondary">{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className={`btn ${buttonClass}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
