import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../utils/ticketHelpers';

function TicketFilters({
  filters,
  categories,
  departments,
  onChange,
  onApply,
  onReset,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="row g-3">
          <div className="col-12 col-xl-4">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Ticket number or title"
            />
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={filters.status} onChange={handleChange}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">Priority</label>
            <select className="form-select" name="priority" value={filters.priority} onChange={handleChange}>
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">Category</label>
            <select className="form-select" name="categoryId" value={filters.categoryId} onChange={handleChange}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">Department</label>
            <select className="form-select" name="departmentId" value={filters.departmentId} onChange={handleChange}>
              <option value="">All</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">Overdue</label>
            <select className="form-select" name="isOverdue" value={filters.isOverdue} onChange={handleChange}>
              <option value="">All</option>
              <option value="true">Overdue</option>
              <option value="false">Not overdue</option>
            </select>
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">From</label>
            <input type="date" className="form-control" name="startDate" value={filters.startDate} onChange={handleChange} />
          </div>
          <div className="col-6 col-xl-2">
            <label className="form-label">To</label>
            <input type="date" className="form-control" name="endDate" value={filters.endDate} onChange={handleChange} />
          </div>
          <div className="col-12 d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={onReset}>
              Reset
            </button>
            <button type="button" className="btn btn-primary" onClick={onApply}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketFilters;
