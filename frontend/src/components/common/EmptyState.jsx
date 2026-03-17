function EmptyState({ title, description, action }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-5 text-center">
        <div className="display-6 text-secondary mb-3">
          <i className="bi bi-inbox"></i>
        </div>
        <h2 className="h5 fw-semibold text-dark mb-2">{title}</h2>
        <p className="text-secondary mb-3">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default EmptyState;
