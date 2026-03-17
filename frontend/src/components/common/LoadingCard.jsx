function LoadingCard({ message = 'Loading...', compact = false }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className={`card-body text-center ${compact ? 'p-4' : 'p-5'}`}>
        <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
        <p className="text-secondary mb-0">{message}</p>
      </div>
    </div>
  );
}

export default LoadingCard;
