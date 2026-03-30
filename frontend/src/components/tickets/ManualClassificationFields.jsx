// Manual ticket classification inputs (category, priority, location) when AI assist is off.

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: 'Infer from description' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'UNKNOWN', label: 'Not sure' },
];

function ManualClassificationFields({
  formState,
  errors,
  categoryOptions = [],
  subcategoryOptions = [],
  locationOptions = [],
  onChange,
  disabled = false,
}) {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Title (optional)</label>
        <input
          type="text"
          name="title"
          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
          value={formState.title ?? ''}
          onChange={handleInputChange}
          placeholder="Short summary"
          disabled={disabled}
        />
        {errors.title ? <div className="invalid-feedback">{errors.title}</div> : <div className="form-text">If empty, the first part of your description is used.</div>}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Category</label>
        <select
          name="categoryId"
          className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
          value={formState.categoryId ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">Select category</option>
          {categoryOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <div className="invalid-feedback">{errors.categoryId}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Subcategory</label>
        <select
          name="subcategoryId"
          className={`form-select ${errors.subcategoryId ? 'is-invalid' : ''}`}
          value={formState.subcategoryId ?? ''}
          onChange={handleInputChange}
          disabled={disabled || !formState.categoryId}
        >
          <option value="">{formState.categoryId ? 'Select subcategory' : 'Select a category first'}</option>
          {subcategoryOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.subcategoryId ? <div className="invalid-feedback">{errors.subcategoryId}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Priority</label>
        <select
          name="priority"
          className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
          value={formState.priority ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">Select priority</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.priority ? <div className="invalid-feedback">{errors.priority}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Issue type</label>
        <select
          name="issueType"
          className={`form-select ${errors.issueType ? 'is-invalid' : ''}`}
          value={formState.issueType ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          {ISSUE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || 'infer'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.issueType ? <div className="invalid-feedback">{errors.issueType}</div> : (
          <div className="form-text">Choose Hardware if the ticket needs a physical location (e.g. ward, room).</div>
        )}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Location (optional)</label>
        <select
          name="locationId"
          className={`form-select ${errors.locationId ? 'is-invalid' : ''}`}
          value={formState.locationId ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">No specific location</option>
          {locationOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {[item.block, item.floor, item.ward, item.room, item.unit].filter(Boolean).join(' · ') || item.name || item.id}
            </option>
          ))}
        </select>
        {errors.locationId ? <div className="invalid-feedback">{errors.locationId}</div> : (
          <div className="form-text">Required when issue type is Hardware.</div>
        )}
      </div>
    </>
  );
}

export default ManualClassificationFields;
