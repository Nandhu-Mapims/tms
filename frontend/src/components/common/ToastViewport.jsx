function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-stack position-fixed top-0 end-0 p-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast show border-0 shadow toast-${toast.variant}`} role="alert" aria-live="assertive">
          <div className="toast-header border-0 bg-transparent">
            <strong className="me-auto">{toast.title}</strong>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => onDismiss(toast.id)}
            ></button>
          </div>
          <div className="toast-body pt-0">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
