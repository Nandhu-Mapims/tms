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
      <div className="text-secondary small text-center text-lg-start">
        <span className="d-lg-none">
          Pg {meta.page}/{meta.totalPages} · {meta.total} total · {meta.limit}/pg
        </span>
        <span className="d-none d-lg-inline">
          Page {meta.page} of {meta.totalPages} | {meta.total} records total | {meta.limit} per page
        </span>
      </div>
      <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-end">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <span className="d-sm-none">Prev</span>
          <span className="d-none d-sm-inline">Previous</span>
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
