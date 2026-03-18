import { PRIORITY_OPTIONS } from '../../utils/ticketHelpers';

function TicketForm({
  formState,
  errors,
  categories,
  subcategories,
  departments,
  locations,
  onChange,
  onFileChange,
  onSubmit,
  isSubmitting,
}) {
  const attachmentAccept = [
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
  ].join(',');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <form onSubmit={onSubmit} className="card border-0 shadow-sm" noValidate>
      <div className="card-body p-4 p-lg-5">
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-semibold">Title</label>
            <input
              type="text"
              name="title"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              value={formState.title}
              onChange={handleInputChange}
              maxLength="150"
            />
            {errors.title ? <div className="invalid-feedback">{errors.title}</div> : <div className="form-text">Keep the summary concise and operationally clear.</div>}
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              rows="4"
              name="description"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              value={formState.description}
              onChange={handleInputChange}
            />
            {errors.description ? <div className="invalid-feedback">{errors.description}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Category</label>
            <select
              name="categoryId"
              className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
              value={formState.categoryId}
              onChange={handleInputChange}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? <div className="invalid-feedback">{errors.categoryId}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Subcategory</label>
            <select
              name="subcategoryId"
              className={`form-select ${errors.subcategoryId ? 'is-invalid' : ''}`}
              value={formState.subcategoryId}
              onChange={handleInputChange}
              disabled={!formState.categoryId}
            >
              <option value="">Select subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {errors.subcategoryId ? <div className="invalid-feedback">{errors.subcategoryId}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Department</label>
            <select
              name="departmentId"
              className={`form-select ${errors.departmentId ? 'is-invalid' : ''}`}
              value={formState.departmentId}
              onChange={handleInputChange}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {errors.departmentId ? <div className="invalid-feedback">{errors.departmentId}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Location</label>
            <select
              name="locationId"
              className={`form-select ${errors.locationId ? 'is-invalid' : ''}`}
              value={formState.locationId}
              onChange={handleInputChange}
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {[location.block, location.floor, location.ward, location.room].filter(Boolean).join(' / ')}
                </option>
              ))}
            </select>
            {errors.locationId ? <div className="invalid-feedback">{errors.locationId}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Priority</label>
            <select
              name="priority"
              className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
              value={formState.priority}
              onChange={handleInputChange}
            >
              <option value="">Select priority</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            {errors.priority ? <div className="invalid-feedback">{errors.priority}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Telecom Number (Optional)</label>
            <input
              type="text"
              name="telecomNumber"
              className="form-control"
              value={formState.telecomNumber}
              onChange={handleInputChange}
              placeholder="Extension / mobile number"
              maxLength="80"
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Attachment (Optional)</label>
            <input
              type="file"
              accept={attachmentAccept}
              className={`form-control ${errors.attachment ? 'is-invalid' : ''}`}
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
            {errors.attachment ? <div className="invalid-feedback">{errors.attachment}</div> : <div className="form-text">Allowed: PDF, Word, text, JPG, PNG, WEBP up to 10MB.</div>}
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span>Submitting...</span>
              </span>
            ) : 'Create Ticket'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default TicketForm;
