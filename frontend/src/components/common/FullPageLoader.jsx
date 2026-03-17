function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-app-shell">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
        <p className="text-secondary mb-0">{message}</p>
      </div>
    </div>
  );
}

export default FullPageLoader;
