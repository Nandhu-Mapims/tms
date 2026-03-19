function PaginationControls({ meta, onPageChange }) {
  if (!meta) {
    return null;
  }

  const startPage = Math.max(1, meta.page - 2);
  const endPage = Math.min(meta.totalPages, startPage + 4);
  const pages = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mt-4">
      <div className="text-secondary small">
        Page {meta.page} of {meta.totalPages} | {meta.total} records total | {meta.limit} per page
      </div>
      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`btn ${page === meta.page ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
